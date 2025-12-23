import asyncio
import json
import shutil
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from time import perf_counter, perf_counter_ns
from typing import Awaitable, Callable, Dict, List

from models import TestCase, TestResult


@dataclass
class CompileResult:
    success: bool
    code: str | None
    compileTimeMs: float
    error: str | None = None


@dataclass
class RunResult:
    testResults: List[TestResult]
    totalExecutionTimeMs: float
    peakMemoryUsageBytes: int


async def compile_python(code: str) -> CompileResult:
    """Perform a lightweight syntax check for Python code and measure time."""
    start_ns = perf_counter_ns()
    try:
        compile(code, "<user_code>", "exec")
    except SyntaxError as exc:
        elapsed_ms = (perf_counter_ns() - start_ns) / 1_000_000
        return CompileResult(False, None, elapsed_ms, f"{exc.__class__.__name__}: {exc}")

    elapsed_ms = (perf_counter_ns() - start_ns) / 1_000_000
    return CompileResult(True, code, elapsed_ms, None)


async def run_code(
    compiled_code: str,
    function_name: str,
    test_cases: List[TestCase],
    on_test_result: Callable[[TestResult], Awaitable[None]],
) -> RunResult:
    """Execute compiled Python code against all test cases in a temp workspace."""
    work_dir_path = Path(tempfile.mkdtemp(prefix="executor-python-"))
    test_results: List[TestResult] = []
    total_execution_ms = 0.0
    peak_memory_bytes = 0

    try:
        for index, test_case in enumerate(test_cases):
            single = await _run_single_test(
                work_dir_path, compiled_code, function_name, test_case, index
            )

            result = TestResult(
                testIndex=index,
                passed=single["passed"],
                input=test_case.input,
                expectedOutput=test_case.expectedOutput,
                actualOutput=single.get("actualOutput"),
                error=single.get("error"),
                executionTimeMs=single["executionTimeMs"],
                memoryUsageBytes=single["memoryUsageBytes"],
            )

            test_results.append(result)
            total_execution_ms += single["executionTimeMs"]
            peak_memory_bytes = max(peak_memory_bytes, single["memoryUsageBytes"])

            await on_test_result(result)
    finally:
        shutil.rmtree(work_dir_path, ignore_errors=True)

    return RunResult(test_results, total_execution_ms, peak_memory_bytes)


async def _run_single_test(
    work_dir: Path,
    compiled_code: str,
    function_name: str,
    test_case: TestCase,
    index: int,
) -> Dict[str, object]:
    """Run a single test case in an isolated subprocess."""
    script_path = work_dir / f"test_{index}.py"
    harness = _build_harness(compiled_code, function_name, test_case)
    script_path.write_text(harness, encoding="utf-8")

    start_wall = perf_counter()
    proc = await asyncio.create_subprocess_exec(
        sys.executable,
        str(script_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=str(work_dir),
    )

    stdout, stderr = await proc.communicate()
    wall_ms = (perf_counter() - start_wall) * 1000.0

    if proc.returncode != 0 or stderr:
        return {
            "passed": False,
            "actualOutput": None,
            "executionTimeMs": wall_ms,
            "memoryUsageBytes": 0,
            "error": stderr.decode() or f"Process exited with code {proc.returncode}",
        }

    output_lines = stdout.decode().strip().splitlines()
    if not output_lines:
        return {
            "passed": False,
            "actualOutput": None,
            "executionTimeMs": wall_ms,
            "memoryUsageBytes": 0,
            "error": "No output from test harness",
        }

    try:
        data = json.loads(output_lines[-1])
    except json.JSONDecodeError as exc:
        return {
            "passed": False,
            "actualOutput": None,
            "executionTimeMs": wall_ms,
            "memoryUsageBytes": 0,
            "error": f"Invalid JSON from harness: {exc}",
        }

    if not data.get("success"):
        return {
            "passed": False,
            "actualOutput": None,
            "executionTimeMs": float(data.get("executionTimeMs", wall_ms)),
            "memoryUsageBytes": int(data.get("memoryUsageBytes", 0)),
            "error": data.get("error") or "Unknown error in harness",
        }

    return {
        "passed": True,
        "actualOutput": data.get("result"),
        "executionTimeMs": float(data.get("executionTimeMs", wall_ms)),
        "memoryUsageBytes": int(data.get("memoryUsageBytes", 0)),
    }


def _build_harness(code: str, function_name: str, test_case: TestCase) -> str:
    """Build the Python harness script that wraps user code and a single test."""
    test_input = json.dumps(test_case.input)

    # The harness prints a single JSON line describing the outcome of the call.
    return f"""import json
import time
import tracemalloc

{code}

def _run():
    input_value = {test_input}
    args = input_value if isinstance(input_value, list) else [input_value]
    tracemalloc.start()
    start_ns = time.perf_counter_ns()
    try:
        result = {function_name}(*args)
        end_ns = time.perf_counter_ns()
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        print(json.dumps({{
            "success": True,
            "result": result,
            "executionTimeMs": (end_ns - start_ns) / 1_000_000,
            "memoryUsageBytes": int(peak),
        }}, default=str))
    except Exception as exc:  # noqa: BLE001
        end_ns = time.perf_counter_ns()
        tracemalloc.stop()
        print(json.dumps({{
            "success": False,
            "error": str(exc),
            "executionTimeMs": (end_ns - start_ns) / 1_000_000,
            "memoryUsageBytes": 0,
        }}, default=str))


if __name__ == "__main__":
    _run()
"""

