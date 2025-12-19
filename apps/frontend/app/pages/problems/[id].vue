<template>
  <div class="h-[calc(100vh-8rem)]">
    <div v-if="pending" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8" />
    </div>

    <div v-else-if="error" class="text-red-500">
      {{ $t('common.error') }}: {{ error.message }}
    </div>

    <div v-else-if="problem" class="grid grid-cols-2 gap-4 h-full">
      <!-- Left: Problem Description -->
      <div class="overflow-auto">
        <UCard class="h-full">
          <template #header>
            <div class="flex items-center justify-between">
              <h1 class="text-2xl font-bold">{{ problem.title }}</h1>
              <UBadge :color="getDifficultyColor(problem.difficulty)" variant="subtle">
                {{ $t(`problems.difficulty.${problem.difficulty}`) }}
              </UBadge>
            </div>
          </template>

          <div class="prose dark:prose-invert max-w-none">
            <h3>{{ $t('problem.description') }}</h3>
            <div v-html="renderedDescription" />
          </div>

          <div class="mt-6">
            <h3 class="text-lg font-semibold mb-3">{{ $t('problem.testCases') }}</h3>
            <div class="space-y-2">
              <div v-for="(tc, i) in problem.testCases" :key="i" class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono">
                <div><strong>{{ $t('problem.input') }}:</strong> {{ JSON.stringify(tc.input) }}</div>
                <div v-if="tc.description" class="text-gray-500 text-xs mt-1">{{ tc.description }}</div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Right: Code Editor & Results -->
      <div class="flex flex-col gap-4 h-full">
        <!-- Editor -->
        <div class="flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span class="font-semibold">TypeScript</span>
            <div class="flex gap-2">
              <UButton variant="ghost" size="sm" @click="resetCode">
                {{ $t('problem.reset') }}
              </UButton>
              <UButton color="primary" :loading="submitting" @click="submitCode">
                {{ submitting ? $t('problem.submitting') : $t('problem.submit') }}
              </UButton>
            </div>
          </div>
          <ClientOnly>
            <div class="h-[300px] w-full">
              <VueMonacoEditor
                v-model:value="code"
                language="typescript"
                theme="vs-dark"
                :options="editorOptions"
                style="height: 100%; width: 100%;"
              />
            </div>
          </ClientOnly>
        </div>

        <!-- Results -->
        <UCard class="flex-1 min-h-0 overflow-auto">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">{{ $t('problem.results') }}</span>
              <UBadge :color="getStatusColor(execState.status)">
                {{ $t(`execution.status.${execState.status}`) }}
              </UBadge>
            </div>
          </template>

          <!-- Metrics -->
          <div v-if="execState.compileTimeMs !== null" class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {{ $t('execution.compileTime') }}: {{ execState.compileTimeMs }}{{ $t('common.ms') }}
          </div>

          <!-- Test Results -->
          <div v-if="execState.testResults.length > 0" class="space-y-2">
            <div
              v-for="(result, i) in execState.testResults"
              :key="i"
              class="p-3 rounded text-sm"
              :class="result.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'"
            >
              <div class="flex items-center gap-2">
                <UIcon
                  :name="result.passed ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="result.passed ? 'text-green-500' : 'text-red-500'"
                />
                <span class="font-medium">
                  Test {{ i + 1 }}: {{ result.passed ? $t('execution.passed') : $t('execution.failed') }}
                </span>
                <span class="text-gray-500 ml-auto">
                  {{ result.executionTimeMs }}{{ $t('common.ms') }}
                </span>
              </div>
              <div v-if="!result.passed" class="mt-2 font-mono text-xs">
                <div>{{ $t('problem.expected') }}: {{ JSON.stringify(result.expectedOutput) }}</div>
                <div>{{ $t('problem.actual') }}: {{ JSON.stringify(result.actualOutput) }}</div>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div v-if="execState.error" class="text-red-500 mt-4">
            {{ execState.error }}
          </div>

          <!-- Summary -->
          <div v-if="execState.finalResult" class="mt-4 p-3 rounded" :class="execState.finalResult.overallStatus === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'">
            <div class="font-semibold">
              {{ execState.finalResult.overallStatus === 'success' ? $t('execution.allTestsPassed') : $t('execution.someTestsFailed') }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ $t('execution.testsPassed', {
                passed: execState.finalResult.testResults.filter(t => t.passed).length,
                total: execState.finalResult.testResults.length
              }) }}
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';

const route = useRoute();
const config = useRuntimeConfig();
const { state: execState, subscribe, reset: resetExec, setCompiling, setResult, setError } = useExecutionSocket();

const problemId = route.params.id as string;

interface ClientProblem {
  id: string;
  title: string;
  description: string;
  functionName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  testCases: Array<{ index: number; input: unknown[]; description?: string }>;
}

const { data: problem, pending, error } = await useFetch<ClientProblem>(
  `${config.public.apiBaseUrl}/problems/${problemId}`
);

const defaultCode = computed(() => {
  if (!problem.value) return '';
  return `function ${problem.value.functionName}(...args: unknown[]): unknown {
  // Your solution here
  return null;
}`;
});

const code = ref(defaultCode.value);
const submitting = ref(false);

watch(defaultCode, (val) => {
  if (!code.value || code.value === '') code.value = val;
});

const renderedDescription = computed(() => {
  if (!problem.value) return '';
  return problem.value.description
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
    .replace(/\n/g, '<br>');
});

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
};

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 'success';
    case 'medium': return 'warning';
    case 'hard': return 'error';
    default: return 'neutral';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'idle': return 'neutral';
    case 'compiling':
    case 'running': return 'info';
    case 'completed': return 'success';
    case 'failed': return 'error';
    default: return 'neutral';
  }
}

function resetCode() {
  code.value = defaultCode.value;
  resetExec();
}

async function submitCode() {
  if (!problem.value) return;

  submitting.value = true;
  resetExec();
  setCompiling();

  try {
    const response = await fetch(`${config.public.apiBaseUrl}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: problem.value.id,
        language: 'typescript',
        code: code.value,
      }),
    });

    const data = await response.json();

    if (data.status === 'completed' && data.result) {
      // Use the synchronous result directly
      setResult(data.result);
    } else if (data.status === 'failed') {
      setError(data.error || 'Execution failed');
    } else if (data.jobId) {
      // Fallback to WebSocket subscription if result not immediately available
      subscribe(data.jobId);
    }
  } catch (err) {
    console.error('Submit error:', err);
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    submitting.value = false;
  }
}
</script>

