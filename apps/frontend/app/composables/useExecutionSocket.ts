import type { WebSocketEvent, TestResult, ExecutionResult } from '@code-practice/shared-types';

export interface ExecutionState {
  connected: boolean;
  jobId: string | null;
  status: 'idle' | 'compiling' | 'running' | 'completed' | 'failed';
  compileTimeMs: number | null;
  testResults: TestResult[];
  finalResult: ExecutionResult | null;
  error: string | null;
}

export function useExecutionSocket() {
  const config = useRuntimeConfig();
  const wsUrl = config.public.apiBaseUrl.replace('http', 'ws') + '/ws';

  const state = reactive<ExecutionState>({
    connected: false,
    jobId: null,
    status: 'idle',
    compileTimeMs: null,
    testResults: [],
    finalResult: null,
    error: null,
  });

  let socket: WebSocket | null = null;

  function connect() {
    if (socket?.readyState === WebSocket.OPEN) return;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      state.connected = true;
    };

    socket.onclose = () => {
      state.connected = false;
    };

    socket.onerror = () => {
      state.error = 'WebSocket connection error';
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleEvent(data);
      } catch {
        console.error('Failed to parse WebSocket message');
      }
    };
  }

  function handleEvent(event: WebSocketEvent | { type: string; jobId?: string }) {
    if ('type' in event) {
      // Control messages (subscribed, unsubscribed, error)
      if (event.type === 'subscribed') {
        state.jobId = event.jobId || null;
      }
      return;
    }

    // Execution events
    switch (event.event) {
      case 'job_started':
        state.status = 'compiling';
        state.testResults = [];
        state.finalResult = null;
        state.error = null;
        break;

      case 'compile_started':
        state.status = 'compiling';
        break;

      case 'compile_finished':
        const compileData = event.data as { success: boolean; compileTimeMs: number; error?: string };
        state.compileTimeMs = compileData.compileTimeMs;
        if (!compileData.success) {
          state.status = 'failed';
          state.error = compileData.error || 'Compilation failed';
        } else {
          state.status = 'running';
        }
        break;

      case 'test_finished':
        const testResult = event.data as TestResult;
        state.testResults.push(testResult);
        break;

      case 'job_completed':
        state.status = 'completed';
        state.finalResult = event.data as ExecutionResult;
        break;

      case 'job_failed':
        state.status = 'failed';
        state.finalResult = event.data as ExecutionResult;
        state.error = state.finalResult.errorMessage || 'Execution failed';
        break;
    }
  }

  function subscribe(jobId: string) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      connect();
      // Wait for connection then subscribe
      setTimeout(() => subscribe(jobId), 100);
      return;
    }

    // Reset state for new job
    state.status = 'idle';
    state.compileTimeMs = null;
    state.testResults = [];
    state.finalResult = null;
    state.error = null;

    socket.send(JSON.stringify({ type: 'subscribe', jobId }));
  }

  function disconnect() {
    if (socket) {
      socket.close();
      socket = null;
    }
  }

  function reset() {
    state.status = 'idle';
    state.jobId = null;
    state.compileTimeMs = null;
    state.testResults = [];
    state.finalResult = null;
    state.error = null;
  }

  function setCompiling() {
    state.status = 'compiling';
    state.testResults = [];
    state.finalResult = null;
    state.error = null;
  }

  function setResult(result: ExecutionResult) {
    state.status = 'completed';
    state.compileTimeMs = result.metrics?.compileTimeMs ?? null;
    state.testResults = [...result.testResults];
    state.finalResult = result;
  }

  function setError(error: string) {
    state.status = 'failed';
    state.error = error;
  }

  // Auto-connect on mount
  onMounted(() => connect());
  onUnmounted(() => disconnect());

  return {
    state: readonly(state),
    connect,
    subscribe,
    disconnect,
    reset,
    setCompiling,
    setResult,
    setError,
  };
}

