import type { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid';
import type {
  JobSubmission,
  Job,
  ExecutorRequest,
  ExecutorResponse,
} from '@code-practice/shared-types';
import { getExerciseById } from '../data/library.js';

const EXECUTOR_URL = process.env.EXECUTOR_NODE_URL || 'http://localhost:3002';

// In-memory job store (replace with database in production)
const jobs = new Map<string, Job>();

export const jobRoutes: FastifyPluginAsync = async (fastify) => {
  // Submit a new job
  fastify.post<{ Body: JobSubmission & { jobId?: string } }>('/jobs', async (request, reply) => {
    const { exerciseId, language, code, userId } = request.body;

    // Validate problem exists
    const exercise = getExerciseById(exerciseId);
    if (!exercise) {
      return reply.code(404).send({ error: 'Exercise not found' });
    }

    // Use client-provided jobId or generate one
    const jobId = request.body.jobId || nanoid();
    const job: Job = {
      id: jobId,
      exerciseId,
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
        exercise,
        code,
        language,
      };

      const response = await fetch(`${EXECUTOR_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executorRequest),
      });

      const result: ExecutorResponse = await response.json() as ExecutorResponse;

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

