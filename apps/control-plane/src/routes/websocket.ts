import type { FastifyPluginAsync } from 'fastify';
import { WebSocket } from 'ws';

const EXECUTOR_NODE_WS_URL = process.env.EXECUTOR_NODE_WS_URL || 'ws://localhost:3002/ws';
const EXECUTOR_PYTHON_WS_URL = process.env.EXECUTOR_PYTHON_WS_URL || 'ws://localhost:3003/ws';

function getExecutorWsUrl(language?: string): string {
	  if (language === 'python') {
	  	  return EXECUTOR_PYTHON_WS_URL;
	  }
	  // Default to Node executor for all other languages
	  return EXECUTOR_NODE_WS_URL;
}

export const websocketRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/ws', { websocket: true }, (clientSocket, _request) => {
    let executorSocket: WebSocket | null = null;
	    let executorUrl: string | null = null;
    let subscribedJobId: string | null = null;

    clientSocket.on('message', (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());

	        if (message.type === 'subscribe' && message.jobId) {
	          subscribedJobId = message.jobId;
	          const targetUrl = getExecutorWsUrl(message.language);

	          // Connect to the appropriate executor WebSocket if not already connected
	          if (!executorSocket || executorSocket.readyState !== WebSocket.OPEN || executorUrl !== targetUrl) {
	            if (executorSocket && executorSocket.readyState === WebSocket.OPEN) {
	              executorSocket.close();
	            }
	            executorUrl = targetUrl;
	            executorSocket = new WebSocket(targetUrl);

	            executorSocket.on('open', () => {
	              // Subscribe to the job on the executor
	              executorSocket?.send(JSON.stringify({
	                type: 'subscribe',
	                jobId: subscribedJobId,
	              }));
	            });

	            executorSocket.on('message', (data) => {
	              // Forward executor messages to client
	              if (clientSocket.readyState === 1) { // WebSocket.OPEN
	                clientSocket.send(data.toString());
	              }
	            });

	            executorSocket.on('error', (error) => {
	              console.error('Executor WebSocket error:', error);
	              clientSocket.send(JSON.stringify({
	                type: 'error',
	                message: 'Executor connection error',
	              }));
	            });

	            executorSocket.on('close', () => {
	              executorSocket = null;
	              executorUrl = null;
	            });
	          } else {
	            // Already connected to the right executor, just subscribe to new job
	            executorSocket.send(JSON.stringify({
	              type: 'subscribe',
	              jobId: message.jobId,
	            }));
	          }

          clientSocket.send(JSON.stringify({
            type: 'subscribed',
            jobId: message.jobId,
          }));
        }

        if (message.type === 'unsubscribe' && message.jobId) {
          if (executorSocket && executorSocket.readyState === WebSocket.OPEN) {
            executorSocket.send(JSON.stringify({
              type: 'unsubscribe',
              jobId: message.jobId,
            }));
          }
          subscribedJobId = null;

          clientSocket.send(JSON.stringify({
            type: 'unsubscribed',
            jobId: message.jobId,
          }));
        }
      } catch {
        clientSocket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    clientSocket.on('close', () => {
      if (executorSocket) {
        executorSocket.close();
        executorSocket = null;
      }
    });
  });
};

