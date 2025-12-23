<template>
  <div class="h-full">
    <div v-if="pending" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8" />
    </div>

    <div v-else-if="error" class="text-red-500 p-4">
      {{ $t('common.error') }}: {{ error.message }}
    </div>

    <Splitpanes v-else-if="exercise" class="default-theme h-full">
      <!-- Left: Problem Description -->
        <Pane :size="40" :min-size="20">
          <div class="h-full p-4">
            <UCard
              class="h-full flex flex-col overflow-hidden"
              :ui="{ body: 'flex-1 min-h-0 overflow-auto pr-2' }"
            >
              <template #header>
            <div class="flex items-center justify-between">
              <h1 class="text-2xl font-bold">{{ exercise.title }}</h1>
              <UBadge :color="getDifficultyColor(exercise.difficulty)" variant="subtle">
                {{ $t(`exercises.difficulty.${exercise.difficulty}`) }}
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
                  <div
                    v-for="(tc, i) in exercise.testCases"
                    :key="i"
                    class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono"
                  >
                    <div><strong>{{ $t('problem.input') }}:</strong> {{ JSON.stringify(tc.input) }}</div>
                    <div v-if="tc.description" class="text-gray-500 text-xs mt-1">{{ tc.description }}</div>
                  </div>
                </div>
              </div>
          </UCard>
        </div>
      </Pane>

      <!-- Right: Code Editor & Results (vertical split) -->
      <Pane :size="60" :min-size="30">
        <Splitpanes horizontal class="h-full">
          <!-- Top: Editor -->
          <Pane :size="60" :min-size="20">
            <div class="flex flex-col h-full border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
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
                <div class="flex-1 min-h-0">
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
          </Pane>

          <!-- Bottom: Results -->
          <Pane :size="40" :min-size="15">
            <div class="h-full overflow-auto p-4">
              <div class="flex items-center justify-between mb-4">
                <span class="font-semibold">{{ $t('problem.results') }}</span>
                <UBadge :color="getStatusColor(execState.status)">
                  {{ $t(`execution.status.${execState.status}`) }}
                </UBadge>
              </div>

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
            </div>
          </Pane>
        </Splitpanes>
      </Pane>
    </Splitpanes>
  </div>
</template>

<script setup lang="ts">
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';

definePageMeta({
  layout: 'app',
  middleware: 'auth',
});

const route = useRoute();
const config = useRuntimeConfig();
const { state: execState, subscribe, reset: resetExec, setCompiling, setError } = useExecutionSocket();

const exerciseId = route.params.id as string;

interface ClientExercise {
  id: string;
  title: string;
  description: string;
  functionName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  testCases: Array<{ index: number; input: unknown[]; description?: string }>;
}

const { data: exercise, pending, error } = await useFetch<ClientExercise>(
  `${config.public.apiBaseUrl}/library/${exerciseId}`
);

const defaultCode = computed(() => {
  if (!exercise.value) return '';
  return `function ${exercise.value.functionName}(...args: unknown[]): unknown {
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
  if (!exercise.value) return '';
  return exercise.value.description
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
  if (!exercise.value) return;

  submitting.value = true;
  resetExec();

  // Generate a job ID upfront so we can subscribe before submitting
  const jobId = crypto.randomUUID();

  try {
    // Subscribe to WebSocket FIRST to receive live updates
    await subscribe(jobId);
    setCompiling();

    // Now submit the job with the same jobId
    const response = await fetch(`${config.public.apiBaseUrl}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        exerciseId: exercise.value.id,
        language: 'typescript',
        code: code.value,
      }),
    });

    const data = await response.json();

    // The WebSocket should handle live updates, but if it fails
    // we can still use the REST response as fallback
    if (data.status === 'failed' && !execState.finalResult) {
      setError(data.error || 'Execution failed');
    }
  } catch (err) {
    console.error('Submit error:', err);
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    submitting.value = false;
  }
}
</script>

<style>
/* Splitpanes dark mode styling */
.splitpanes.default-theme .splitpanes__splitter {
  background-color: var(--ui-border);
}

.splitpanes.default-theme .splitpanes__splitter:hover {
  background-color: var(--ui-border-accented);
}

.splitpanes.default-theme .splitpanes__splitter::before,
.splitpanes.default-theme .splitpanes__splitter::after {
  background-color: var(--ui-text-muted);
}

.splitpanes.default-theme .splitpanes__pane {
  background-color: var(--ui-bg);
}
</style>
