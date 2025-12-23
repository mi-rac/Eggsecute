import json
import os
from datetime import datetime
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from models import (
    ExecutorRequest,
    ExecutorResponse,
    ExecutionMetrics,
    ExecutionResult,
    TestResult,
    WebSocketEvent,
)
from runner import CompileResult, RunResult, compile_python, run_code
from websocket_manager import broadcast_to_job, subscribe_to_job, unsubscribe_from_job


app = FastAPI(title="Python Executor", version="0.1.0")


allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


def _to_data(obj: Any) -> Any:
    """Best-effort conversion to plain JSON-serialisable data."""
    if hasattr(obj, "model_dump"):
        return obj.model_dump()  # pydantic v2
    if hasattr(obj, "dict"):
        return obj.dict()  # pydantic v1
    return obj


def create_event(job_id: str, event: str, data: Any | None = None) -> WebSocketEvent:
    return WebSocketEvent(
        jobId=job_id,
        event=event,  # type: ignore[arg-type]
        timestamp=datetime.utcnow(),
        data=_to_data(data) if data is not None else None,
    )


@app.post("/execute", response_model=ExecutorResponse)
async def execute(request: ExecutorRequest) -> ExecutorResponse:
    job_id = request.jobId
    exercise = request.exercise
    language = request.language

    if language != "python":
        return ExecutorResponse(
            jobId=job_id,
            success=False,
            error="This executor only supports Python",
        )

    await broadcast_to_job(
        job_id,
        create_event(
            job_id,
            "job_started",
            {"language": language, "totalTests": len(exercise.testCases)},
        ),
    )

    await broadcast_to_job(job_id, create_event(job_id, "compile_started"))

    compile_result: CompileResult = await compile_python(request.code)

    await broadcast_to_job(
        job_id,
        create_event(
            job_id,
            "compile_finished",
            {
                "success": compile_result.success,
                "compileTimeMs": compile_result.compileTimeMs,
                "error": compile_result.error,
            },
        ),
    )

    if not compile_result.success or not compile_result.code:
        result = ExecutionResult(
            jobId=job_id,
            language=language,
            testResults=[],
            metrics=ExecutionMetrics(
                compileTimeMs=compile_result.compileTimeMs,
                totalExecutionTimeMs=0.0,
                averageExecutionTimeMs=0.0,
            ),
            overallStatus="error",
            errorMessage=compile_result.error,
        )

        await broadcast_to_job(job_id, create_event(job_id, "job_failed", result))

        return ExecutorResponse(
            jobId=job_id,
            success=False,
            result=result,
            error=compile_result.error,
        )

    async def on_test_result(test_result: TestResult) -> None:
        await broadcast_to_job(
            job_id,
            create_event(job_id, "test_started", {"testIndex": test_result.testIndex}),
        )
        await broadcast_to_job(job_id, create_event(job_id, "test_finished", test_result))

    try:
        run_result: RunResult = await run_code(
            compiled_code=compile_result.code,
            function_name=exercise.functionName,
            test_cases=exercise.testCases,
            on_test_result=on_test_result,
        )

        passed_count = sum(1 for t in run_result.testResults if t.passed)
        total_tests = len(exercise.testCases)

        if passed_count == total_tests:
            overall_status: ExecutionResult["overallStatus"] | str = "success"
        elif passed_count > 0:
            overall_status = "partial"
        else:
            overall_status = "failed"

        result = ExecutionResult(
            jobId=job_id,
            language=language,
            testResults=run_result.testResults,
            metrics=ExecutionMetrics(
                compileTimeMs=compile_result.compileTimeMs,
                totalExecutionTimeMs=run_result.totalExecutionTimeMs,
                averageExecutionTimeMs=(
                    run_result.totalExecutionTimeMs / max(total_tests, 1)
                ),
                peakMemoryUsageBytes=run_result.peakMemoryUsageBytes,
            ),
            overallStatus=overall_status,  # type: ignore[arg-type]
        )

        await broadcast_to_job(job_id, create_event(job_id, "job_completed", result))

        return ExecutorResponse(jobId=job_id, success=True, result=result)
    except Exception as exc:  # noqa: BLE001
        error_message = str(exc)
        result = ExecutionResult(
            jobId=job_id,
            language=language,
            testResults=[],
            metrics=ExecutionMetrics(
                compileTimeMs=compile_result.compileTimeMs,
                totalExecutionTimeMs=0.0,
                averageExecutionTimeMs=0.0,
            ),
            overallStatus="error",
            errorMessage=error_message,
        )

        await broadcast_to_job(job_id, create_event(job_id, "job_failed", result))

        return ExecutorResponse(
            jobId=job_id,
            success=False,
            result=result,
            error=error_message,
        )


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    subscribed_job_id: str | None = None

    try:
        while True:
            raw = await ws.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_text(
                    json.dumps({"type": "error", "message": "Invalid message format"})
                )
                continue

            msg_type = message.get("type")
            job_id = message.get("jobId")

            if msg_type == "subscribe" and job_id:
                job_id = str(job_id)
                if subscribed_job_id:
                    await unsubscribe_from_job(subscribed_job_id, ws)
                subscribed_job_id = job_id
                await subscribe_to_job(job_id, ws)
                await ws.send_text(json.dumps({"type": "subscribed", "jobId": job_id}))

            elif msg_type == "unsubscribe" and job_id:
                job_id = str(job_id)
                await unsubscribe_from_job(job_id, ws)
                if subscribed_job_id == job_id:
                    subscribed_job_id = None
                await ws.send_text(
                    json.dumps({"type": "unsubscribed", "jobId": job_id})
                )
    except WebSocketDisconnect:
        pass
    finally:
        if subscribed_job_id:
            await unsubscribe_from_job(subscribed_job_id, ws)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3003"))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(app, host=host, port=port)

