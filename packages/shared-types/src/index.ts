/**
 * Shared types for the Code Practice Platform
 * Used across frontend, control plane, and executors
 */

// ============================================================================
// Language & Problem Types
// ============================================================================

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'cpp';

export interface TestCase {
  input: unknown;
  expectedOutput: unknown;
  description?: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  functionName: string;
  inputSchema: unknown; // JSON Schema
  outputSchema: unknown; // JSON Schema
  testCases: TestCase[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

// ============================================================================
// Job Types
// ============================================================================

export interface JobSubmission {
  exerciseId: string;
  language: SupportedLanguage;
  code: string;
  userId?: string;
}

export interface Job {
  id: string;
  exerciseId: string;
  language: SupportedLanguage;
  code: string;
  userId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================================================
// Execution Results
// ============================================================================

export interface TestResult {
  testIndex: number;
  passed: boolean;
  input: unknown;
  expectedOutput: unknown;
  actualOutput?: unknown;
  error?: string;
  executionTimeMs: number;
  memoryUsageBytes?: number;
}

export interface ExecutionMetrics {
  compileTimeMs?: number;
  totalExecutionTimeMs: number;
  averageExecutionTimeMs: number;
  peakMemoryUsageBytes?: number;
  totalMemoryUsageBytes?: number;
}

export interface ExecutionResult {
  jobId: string;
  language: SupportedLanguage;
  testResults: TestResult[];
  metrics: ExecutionMetrics;
  overallStatus: 'success' | 'partial' | 'failed' | 'error';
  errorMessage?: string;
}

// ============================================================================
// WebSocket Events
// ============================================================================

export type WebSocketEventType =
  | 'job_started'
  | 'compile_started'
  | 'compile_finished'
  | 'test_started'
  | 'test_finished'
  | 'job_completed'
  | 'job_failed'
  | 'job_cancelled';

export interface WebSocketEvent {
  jobId: string;
  event: WebSocketEventType;
  timestamp: Date;
  data?: unknown;
}

export interface JobStartedEvent extends WebSocketEvent {
  event: 'job_started';
  data: {
    language: SupportedLanguage;
    totalTests: number;
  };
}

export interface CompileFinishedEvent extends WebSocketEvent {
  event: 'compile_finished';
  data: {
    success: boolean;
    compileTimeMs: number;
    error?: string;
  };
}

export interface TestFinishedEvent extends WebSocketEvent {
  event: 'test_finished';
  data: TestResult;
}

export interface JobCompletedEvent extends WebSocketEvent {
  event: 'job_completed';
  data: ExecutionResult;
}

// ============================================================================
// Executor API Types
// ============================================================================

export interface ExecutorRequest {
  jobId: string;
  exercise: Exercise;
  code: string;
  language: SupportedLanguage;
}

export interface ExecutorResponse {
  jobId: string;
  success: boolean;
  result?: ExecutionResult;
  error?: string;
}

