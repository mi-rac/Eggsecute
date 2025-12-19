import type { FastifyPluginAsync } from 'fastify';
import { subscribeToJob, unsubscribeFromJob } from '../types.js';

export const websocketRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/ws', { websocket: true }, (socket, _request) => {
    let subscribedJobId: string | null = null;

    socket.on('message', (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        
        if (message.type === 'subscribe' && message.jobId) {
          // Unsubscribe from previous job if any
          if (subscribedJobId) {
            unsubscribeFromJob(subscribedJobId, socket);
          }
          
          subscribedJobId = message.jobId;
          subscribeToJob(message.jobId, socket);
          
          socket.send(JSON.stringify({
            type: 'subscribed',
            jobId: message.jobId,
          }));
        }
        
        if (message.type === 'unsubscribe' && message.jobId) {
          unsubscribeFromJob(message.jobId, socket);
          if (subscribedJobId === message.jobId) {
            subscribedJobId = null;
          }
          
          socket.send(JSON.stringify({
            type: 'unsubscribed',
            jobId: message.jobId,
          }));
        }
      } catch {
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    socket.on('close', () => {
      if (subscribedJobId) {
        unsubscribeFromJob(subscribedJobId, socket);
      }
    });
  });
};

