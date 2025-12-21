import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { supabaseClient } from './lib/supabase.js';
import { jobRoutes } from './routes/jobs.js';
import { problemRoutes } from './routes/library.js';
import { websocketRoutes } from './routes/websocket.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-production-domain.com']
    : ['http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
});

await fastify.register(websocket);

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
fastify.register(jobRoutes);
fastify.register(problemRoutes);
fastify.register(websocketRoutes);

// Test Supabase connection endpoint
fastify.get('/api/supabase/test', async (_request, reply) => {
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      return reply.code(500).send({
        success: false,
        message: 'Supabase connection failed',
        error: error.message,
      });
    }

    return {
      success: true,
      message: 'Supabase connection successful',
      project: 'Eggsecute',
      hasSession: !!data.session,
    };
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'Unexpected error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(`🚀 Control Plane running at http://${host}:${port}`);
    console.log(`📊 Health: http://${host}:${port}/health`);
    console.log(`📝 Library: http://${host}:${port}/library`);
    console.log(`⚡ Jobs: POST http://${host}:${port}/jobs`);
    console.log(`🔌 WebSocket: ws://${host}:${port}/ws`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

