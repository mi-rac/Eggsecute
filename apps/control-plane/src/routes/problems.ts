import type { FastifyPluginAsync } from 'fastify';
import { getProblem, getAllProblems } from '../data/problems.js';

export const problemRoutes: FastifyPluginAsync = async (fastify) => {
  // List all problems
  fastify.get('/problems', async (_request, reply) => {
    const problems = getAllProblems();
    
    // Return summary (without full test cases for listing)
    const summaries = problems.map(p => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      description: p.description.substring(0, 150) + '...',
    }));

    return reply.send(summaries);
  });

  // Get a specific problem
  fastify.get<{ Params: { problemId: string } }>('/problems/:problemId', async (request, reply) => {
    const { problemId } = request.params;
    const problem = getProblem(problemId);

    if (!problem) {
      return reply.code(404).send({ error: 'Problem not found' });
    }

    // Return problem with test cases (but hide expected output for client)
    const clientProblem = {
      ...problem,
      testCases: problem.testCases.map((tc, i) => ({
        index: i,
        input: tc.input,
        description: tc.description,
        // Don't send expectedOutput to client - let them figure it out!
      })),
    };

    return reply.send(clientProblem);
  });

  // Get problem with full test cases (for internal use / debugging)
  fastify.get<{ Params: { problemId: string } }>('/problems/:problemId/full', async (request, reply) => {
    const { problemId } = request.params;
    const problem = getProblem(problemId);

    if (!problem) {
      return reply.code(404).send({ error: 'Problem not found' });
    }

    return reply.send(problem);
  });
};

