import type { FastifyPluginAsync } from 'fastify';
import { getExerciseById, getAllExercises } from '../data/library.js';

export const problemRoutes: FastifyPluginAsync = async (fastify) => {
  // List all exercises
  fastify.get('/library', async (_request, reply) => {
    const exercises = getAllExercises();
    
    // Return summary (without full test cases for listing)
    const summaries = exercises.map(p => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      description: p.description.substring(0, 150) + '...',
    }));

    return reply.send(summaries);
  });

  // Get a specific problem
  fastify.get<{ Params: { exerciseId: string } }>('/library/:exerciseId', async (request, reply) => {
    const { exerciseId } = request.params;
    const problem = getExerciseById(exerciseId);

    if (!problem) {
      return reply.code(404).send({ error: 'Exercise not found' });
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
  fastify.get<{ Params: { exerciseId: string } }>('/library/:exerciseId/full', async (request, reply) => {
    const { exerciseId } = request.params;
    const problem = getExerciseById(exerciseId);

    if (!problem) {
      return reply.code(404).send({ error: 'Exercise not found' });
    }

    return reply.send(problem);
  });
};

