from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import BaseModel


SupportedLanguage = Literal["javascript", "typescript", "python", "cpp"]


class TestCase(BaseModel):
    input: Any
    expectedOutput: Any
    description: Optional[str] = None


class Exercise(BaseModel):
    id: str
    title: str
    description: str
    functionName: str
    inputSchema: Any
    outputSchema: Any
    testCases: List[TestCase]
    difficulty: Optional[Literal["easy", "medium", "hard"]] = None


class ExecutorRequest(BaseModel):
    jobId: str
    exercise: Exercise
    code: str
    language: SupportedLanguage


class TestResult(BaseModel):
    testIndex: int
    passed: bool
    input: Any
    expectedOutput: Any
    actualOutput: Any | None = None
    error: Optional[str] = None
    executionTimeMs: float
    memoryUsageBytes: Optional[int] = None


class ExecutionMetrics(BaseModel):
    compileTimeMs: Optional[float] = None
    totalExecutionTimeMs: float
    averageExecutionTimeMs: float
    peakMemoryUsageBytes: Optional[int] = None
    totalMemoryUsageBytes: Optional[int] = None


class ExecutionResult(BaseModel):
    jobId: str
    language: SupportedLanguage
    testResults: List[TestResult]
    metrics: ExecutionMetrics
    overallStatus: Literal["success", "partial", "failed", "error"]
    errorMessage: Optional[str] = None


class ExecutorResponse(BaseModel):
    jobId: str
    success: bool
    result: Optional[ExecutionResult] = None
    error: Optional[str] = None


WebSocketEventType = Literal[
    "job_started",
    "compile_started",
    "compile_finished",
    "test_started",
    "test_finished",
    "job_completed",
    "job_failed",
    "job_cancelled",
]


class WebSocketEvent(BaseModel):
    jobId: str
    event: WebSocketEventType
    timestamp: datetime
    data: Any | None = None

