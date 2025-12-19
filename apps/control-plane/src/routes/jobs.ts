import type { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid';
import type {
  JobSubmission,
  Job,
  ExecutorRequest,
  ExecutorResponse,
} from '@code-practice/shared-types';
import { getProblem } from '../data/problems.js';

const EXECUTOR_URL = process.env.EXECUTOR_NODE_URL || 'http://localhost:3002';

// In-memory job store (replace with database in production)
const jobs = new Map<string, Job>();

export const jobRoutes: FastifyPluginAsync = async (fastify) => {
  // Submit a new job
  fastify.post<{ Body: JobSubmission }>('/jobs', async (request, reply) => {
    const { problemId, language, code, userId } = request.body;

    // Validate problem exists
    const problem = getProblem(problemId);
    if (!problem) {
      return reply.code(404).send({ error: 'Problem not found' });
    }

    // Create job record
    const jobId = nanoid();
    const job: Job = {
      id: jobId,
      problemId,
      language,
      code,
      userId,
      status: 'pending',
      createdAt: new Date(),
    };
    jobs.set(jobId, job);

    // Forward to executor
    try {
      job.status = 'running';
      job.startedAt = new Date();

      const executorRequest: ExecutorRequest = {
        jobId,
        problem,
        code,
        language,
      };

      const response = await fetch(`${EXECUTOR_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executorRequest),
      });

      const result: ExecutorResponse = await response.json();

      job.status = result.success ? 'completed' : 'failed';
      job.completedAt = new Date();

      return reply.send({
        jobId,
        status: job.status,
        result: result.result,
      });
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();

      const message = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({
        jobId,
        status: 'failed',
        error: `Executor error: ${message}`,
      });
    }
  });

  // Get job status
  fastify.get<{ Params: { jobId: string } }>('/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params;
    const job = jobs.get(jobId);

    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    return reply.send(job);
  });

  // Cancel a job (basic implementation)
  fastify.delete<{ Params: { jobId: string } }>('/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params;
    const job = jobs.get(jobId);

    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    if (job.status === 'pending' || job.status === 'running') {
      job.status = 'cancelled';
      job.completedAt = new Date();
    }

    return reply.send({ jobId, status: job.status });
  });
};

