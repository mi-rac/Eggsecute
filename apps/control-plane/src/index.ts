import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { supabaseClient } from './lib/supabase.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-production-domain.com'] // TODO: Update for production
    : ['http://localhost:3001', 'http://127.0.0.1:3001'], // Nuxt dev server
  credentials: true,
});

await fastify.register(websocket);

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Test Supabase connection endpoint
fastify.get('/api/supabase/test', async (_request, reply) => {
  try {
    // Test the auth connection - this doesn't require any database tables
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
    
    console.log(`🚀 Control Plane server running at http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
    console.log(`🔌 Supabase test: http://${host}:${port}/api/supabase/test`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

