import type { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid';
import type {
  ExecutorRequest,
  ExecutorResponse,
  ExecutionResult,
  WebSocketEvent,
  TestResult,
} from '@code-practice/shared-types';
import { compileTypeScript } from '../lib/compiler.js';
import { runCode } from '../lib/runner.js';
import { broadcastToJob } from '../types.js';

function createEvent(jobId: string, event: string, data?: unknown): WebSocketEvent {
  return {
    jobId,
    event: event as WebSocketEvent['event'],
    timestamp: new Date(),
    data,
  };
}

export const executeRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: ExecutorRequest }>('/execute', async (request, reply) => {
    const { problem, code, language } = request.body;
    const jobId = request.body.jobId || nanoid();

    // Only accept TypeScript
    if (language !== 'typescript') {
      return reply.code(400).send({
        jobId,
        success: false,
        error: 'This executor only supports TypeScript',
      } satisfies ExecutorResponse);
    }

    // Broadcast job started
    broadcastToJob(jobId, createEvent(jobId, 'job_started', {
      language,
      totalTests: problem.testCases.length,
    }));

    // Compile TypeScript
    broadcastToJob(jobId, createEvent(jobId, 'compile_started'));
    
    const compileResult = await compileTypeScript(code);
    
    broadcastToJob(jobId, createEvent(jobId, 'compile_finished', {
      success: compileResult.success,
      compileTimeMs: compileResult.compileTimeMs,
      error: compileResult.error,
    }));

    if (!compileResult.success || !compileResult.code) {
      const result: ExecutionResult = {
        jobId,
        language,
        testResults: [],
        metrics: {
          compileTimeMs: compileResult.compileTimeMs,
          totalExecutionTimeMs: 0,
          averageExecutionTimeMs: 0,
        },
        overallStatus: 'error',
        errorMessage: compileResult.error,
      };

      broadcastToJob(jobId, createEvent(jobId, 'job_failed', result));

      return reply.send({
        jobId,
        success: false,
        result,
        error: compileResult.error,
      } satisfies ExecutorResponse);
    }

    // Run tests
    const onTestResult = (testResult: TestResult) => {
      broadcastToJob(jobId, createEvent(jobId, 'test_started', { testIndex: testResult.testIndex }));
      broadcastToJob(jobId, createEvent(jobId, 'test_finished', testResult));
    };

    try {
      const runResult = await runCode(
        compileResult.code,
        problem.functionName,
        problem.testCases,
        onTestResult,
      );

      const passedCount = runResult.testResults.filter(t => t.passed).length;
      const totalTests = problem.testCases.length;

      let overallStatus: ExecutionResult['overallStatus'];
      if (passedCount === totalTests) {
        overallStatus = 'success';
      } else if (passedCount > 0) {
        overallStatus = 'partial';
      } else {
        overallStatus = 'failed';
      }

      const result: ExecutionResult = {
        jobId,
        language,
        testResults: runResult.testResults,
        metrics: {
          compileTimeMs: compileResult.compileTimeMs,
          totalExecutionTimeMs: runResult.totalExecutionTimeMs,
          averageExecutionTimeMs: runResult.totalExecutionTimeMs / totalTests,
          peakMemoryUsageBytes: runResult.peakMemoryUsageBytes,
        },
        overallStatus,
      };

      broadcastToJob(jobId, createEvent(jobId, 'job_completed', result));

      return reply.send({
        jobId,
        success: true,
        result,
      } satisfies ExecutorResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const result: ExecutionResult = {
        jobId,
        language,
        testResults: [],
        metrics: {
          compileTimeMs: compileResult.compileTimeMs,
          totalExecutionTimeMs: 0,
          averageExecutionTimeMs: 0,
        },
        overallStatus: 'error',
        errorMessage,
      };

      broadcastToJob(jobId, createEvent(jobId, 'job_failed', result));

      return reply.code(500).send({
        jobId,
        success: false,
        result,
        error: errorMessage,
      } satisfies ExecutorResponse);
    }
  });
};

