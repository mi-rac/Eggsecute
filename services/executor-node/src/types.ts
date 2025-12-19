import type { WebSocket } from '@fastify/websocket';

/**
 * Active job tracking for WebSocket updates
 */
export interface ActiveJob {
  jobId: string;
  subscribers: Set<WebSocket>;
}

/**
 * Job store for tracking active jobs and their WebSocket subscribers
 */
export const jobStore = new Map<string, ActiveJob>();

/**
 * Subscribe a WebSocket to job updates
 */
export function subscribeToJob(jobId: string, ws: WebSocket): void {
  let job = jobStore.get(jobId);
  if (!job) {
    job = { jobId, subscribers: new Set() };
    jobStore.set(jobId, job);
  }
  job.subscribers.add(ws);
}

/**
 * Unsubscribe a WebSocket from job updates
 */
export function unsubscribeFromJob(jobId: string, ws: WebSocket): void {
  const job = jobStore.get(jobId);
  if (job) {
    job.subscribers.delete(ws);
    if (job.subscribers.size === 0) {
      jobStore.delete(jobId);
    }
  }
}

/**
 * Broadcast an event to all subscribers of a job
 */
export function broadcastToJob(jobId: string, event: unknown): void {
  const job = jobStore.get(jobId);
  if (job) {
    const message = JSON.stringify(event);
    for (const ws of job.subscribers) {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(message);
      }
    }
  }
}

