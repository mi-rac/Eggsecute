<template>
  <div class="h-full">
    <div v-if="pending" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8" />
    </div>

    <div v-else-if="error" class="text-red-500 p-4">
      {{ $t("common.error") }}: {{ error.message }}
    </div>

    <ClientOnly v-else-if="exercise">
      <Splitpanes class="default-theme h-full">
        <template #fallback>
          <div class="h-full flex">
            <!-- Left skeleton: 30% width -->
            <div class="w-[30%] h-full p-4 bg-default">
              <div
                class="h-full rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            </div>
            <!-- Right skeleton: 70% width -->
            <div
              class="w-[70%] h-full flex flex-col border-l border-gray-200 dark:border-gray-700"
            >
              <div
                class="p-3 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700"
              >
                <div
                  class="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
              </div>
              <div class="flex-1 flex flex-col">
                <div class="flex-6 bg-[#1e1e1e]" />
                <div class="flex-4 p-4 bg-default">
                  <div
                    class="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
        <!-- Left: Problem Description -->
        <Pane :size="30" :min-size="20">
          <div class="h-full p-4">
            <UCard
              class="h-full flex flex-col overflow-hidden"
              :ui="{ body: 'flex-1 min-h-0 overflow-auto pr-2' }"
            >
              <template #header>
                <div class="flex items-center justify-between">
                  <h1 class="text-2xl font-bold">{{ exercise.title }}</h1>
                  <UBadge
                    :color="getDifficultyColor(exercise.difficulty)"
                    variant="subtle"
                  >
                    {{ $t(`exercises.difficulty.${exercise.difficulty}`) }}
                  </UBadge>
                </div>
              </template>

              <div class="prose dark:prose-invert max-w-none">
                <h3>{{ $t("problem.description") }}</h3>
                <div v-html="renderedDescription" />
              </div>

              <div class="mt-6">
                <h3 class="text-lg font-semibold mb-3">
                  {{ $t("problem.testCases") }}
                </h3>
                <div class="space-y-2">
                  <div
                    v-for="(tc, i) in exercise.testCases"
                    :key="i"
                    class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm font-mono"
                  >
                    <div>
                      <strong>{{ $t("problem.input") }}:</strong>
                      {{ JSON.stringify(tc.input) }}
                    </div>
                    <div
                      v-if="tc.description"
                      class="text-gray-500 text-xs mt-1"
                    >
                      {{ tc.description }}
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </Pane>

        <!-- Right: Single code editor & results with language selector -->
        <Pane :size="70" :min-size="30">
          <div
            class="h-full flex flex-col border-l border-gray-200 dark:border-gray-700"
          >
            <div class="flex-1 min-h-0 flex flex-col">
              <!-- Panel header with language selector -->
              <div
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700"
              >
                <USelectMenu
                  v-model="selectedLanguage"
                  :items="languageSelectItems"
                  value-key="value"
                  label-key="label"
                  size="sm"
                />
                <div class="flex gap-2">
                  <UButton
                    variant="ghost"
                    size="sm"
                    @click="resetCode(selectedLanguage)"
                  >
                    {{ $t("problem.reset") }}
                  </UButton>
                  <UButton
                    color="primary"
                    :loading="isSubmitting"
                    @click="submitCode(selectedLanguage)"
                  >
                    {{
                      isSubmitting
                        ? $t("problem.submitting")
                        : $t("problem.submit")
                    }}
                  </UButton>
                </div>
              </div>

              <!-- Editor + Results split vertically -->
              <Splitpanes horizontal class="flex-1 min-h-0">
                <!-- Editor -->
                <Pane :size="60" :min-size="30" class="bg-[#1e1e1e]">
                  <ClientOnly>
                    <div class="h-full bg-[#1e1e1e] border-b border-gray-700">
                      <VueMonacoEditor
                        v-model:value="currentCode"
                        :language="currentPanel.monacoLanguage"
                        theme="vs-dark"
                        :options="editorOptions"
                        style="height: 100%; width: 100%"
                      />
                    </div>
                    <template #fallback>
                      <div
                        class="h-full bg-[#1e1e1e] flex items-center justify-center border-b border-gray-700"
                      >
                        <div
                          class="flex flex-col items-center gap-3 text-gray-400"
                        >
                          <UIcon
                            name="i-heroicons-arrow-path"
                            class="animate-spin size-6"
                          />
                          <span class="text-sm">{{
                            $t("problem.loadingEditor")
                          }}</span>
                        </div>
                      </div>
                    </template>
                  </ClientOnly>
                </Pane>

                <!-- Results -->
                <Pane :size="40" :min-size="20">
                  <div class="h-full overflow-auto p-4">
                    <div class="flex items-center justify-between mb-4">
                      <span class="font-semibold">{{
                        $t("problem.results")
                      }}</span>
                      <UBadge
                        :color="
                          getStatusColor(currentPanel.execution.state.status)
                        "
                      >
                        {{
                          $t(
                            `execution.status.${currentPanel.execution.state.status}`
                          )
                        }}
                      </UBadge>
                    </div>

                    <!-- Metrics -->
                    <div
                      v-if="currentPanel.execution.state.compileTimeMs !== null"
                      class="mb-4 text-sm text-gray-600 dark:text-gray-400"
                    >
                      {{ $t("execution.compileTime") }}:
                      {{ currentPanel.execution.state.compileTimeMs
                      }}{{ $t("common.ms") }}
                    </div>

                    <!-- Test Results -->
                    <div
                      v-if="currentPanel.execution.state.testResults.length > 0"
                      class="space-y-2"
                    >
                      <div
                        v-for="(result, i) in currentPanel.execution.state
                          .testResults"
                        :key="i"
                        class="p-3 rounded text-sm"
                        :class="
                          result.passed
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'bg-red-50 dark:bg-red-900/20'
                        "
                      >
                        <div class="flex items-center gap-2">
                          <UIcon
                            :name="
                              result.passed
                                ? 'i-heroicons-check-circle'
                                : 'i-heroicons-x-circle'
                            "
                            :class="
                              result.passed ? 'text-green-500' : 'text-red-500'
                            "
                          />
                          <span class="font-medium">
                            {{ $t("execution.testLabel", { index: i + 1 }) }}:
                            {{
                              result.passed
                                ? $t("execution.passed")
                                : $t("execution.failed")
                            }}
                          </span>
                          <span class="text-gray-500 ml-auto">
                            {{ result.executionTimeMs }}{{ $t("common.ms") }}
                          </span>
                        </div>
                        <div
                          v-if="!result.passed"
                          class="mt-2 font-mono text-xs"
                        >
                          <div>
                            {{ $t("problem.expected") }}:
                            {{ JSON.stringify(result.expectedOutput) }}
                          </div>
                          <div>
                            {{ $t("problem.actual") }}:
                            {{ JSON.stringify(result.actualOutput) }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Error -->
                    <div
                      v-if="currentPanel.execution.state.error"
                      class="text-red-500 mt-4"
                    >
                      {{ currentPanel.execution.state.error }}
                    </div>

                    <!-- Summary -->
                    <div
                      v-if="currentPanel.execution.state.finalResult"
                      class="mt-4 p-3 rounded"
                      :class="
                        currentPanel.execution.state.finalResult
                          .overallStatus === 'success'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      "
                    >
                      <div class="font-semibold">
                        {{
                          currentPanel.execution.state.finalResult
                            .overallStatus === "success"
                            ? $t("execution.allTestsPassed")
                            : $t("execution.someTestsFailed")
                        }}
                      </div>
                      <div
                        class="text-sm text-gray-600 dark:text-gray-400 mt-1"
                      >
                        {{
                          $t("execution.testsPassed", {
                            passed:
                              currentPanel.execution.state.finalResult.testResults.filter(
                                (t) => t.passed
                              ).length,
                            total:
                              currentPanel.execution.state.finalResult
                                .testResults.length,
                          })
                        }}
                      </div>
                    </div>
                  </div>
                </Pane>
              </Splitpanes>
            </div>
          </div>
        </Pane>
      </Splitpanes>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Splitpanes, Pane } from "splitpanes";
import type { Ref } from "vue";
import type { SupportedLanguage } from "@code-practice/shared-types";

// Lazy load Monaco editor - it's heavy
const VueMonacoEditor = defineAsyncComponent(() =>
  import("@guolao/vue-monaco-editor").then((m) => m.VueMonacoEditor)
);

definePageMeta({
  layout: "app",
  middleware: "auth",
  ssr: false, // Skip SSR for this heavy interactive page
});

const route = useRoute();
const config = useRuntimeConfig();
const { t } = useI18n();

const exerciseId = route.params.id as string;

interface ClientExercise {
  id: string;
  title: string;
  description: string;
  functionName: string;
  difficulty: "easy" | "medium" | "hard";
  testCases: Array<{ index: number; input: unknown[]; description?: string }>;
}

const {
  data: exercise,
  status,
  error,
} = useLazyFetch<ClientExercise>(
  `${config.public.apiBaseUrl}/library/${exerciseId}`
);

const pending = computed(() => status.value === "pending");

type EditorLanguage = Extract<SupportedLanguage, "typescript" | "python">;
const AVAILABLE_LANGUAGES: EditorLanguage[] = ["typescript", "python"];

const STORAGE_KEY = "eggsecute:codeStates:v1";

interface StoredCodeState {
  [exerciseId: string]: Partial<Record<EditorLanguage, string>>;
}

function getDefaultCode(language: EditorLanguage): string {
  if (!exercise.value) return "";
  const fn = exercise.value.functionName;

  if (language === "python") {
    return `def ${fn}(*args):\n    # Your solution here\n    return None`;
  }
  // Default TypeScript solution template
  return `function ${fn}(...args: unknown[]): unknown {\n  // Your solution here\n  return null;\n}`;
}

type ExecutionComposable = ReturnType<typeof useExecutionSocket>;

interface LanguagePanelState {
  language: EditorLanguage;
  labelKey: string;
  monacoLanguage: string;
  code: Ref<string>;
  submitting: Ref<boolean>;
  execution: ExecutionComposable;
}

const languageMeta: Record<
  EditorLanguage,
  { labelKey: string; monacoLanguage: string }
> = {
  typescript: {
    labelKey: "languages.typescript",
    monacoLanguage: "typescript",
  },
  python: {
    labelKey: "languages.python",
    monacoLanguage: "python",
  },
};

function loadStoredCode(
  exerciseId: string,
  language: EditorLanguage,
  defaultCode: string
): string {
  if (import.meta.server) return defaultCode;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCode;
    const parsed = JSON.parse(raw) as StoredCodeState;
    return parsed?.[exerciseId]?.[language] ?? defaultCode;
  } catch {
    return defaultCode;
  }
}

function saveCode(exerciseId: string, language: EditorLanguage, code: string) {
  if (import.meta.server) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: StoredCodeState = raw ? JSON.parse(raw) : {};
    if (!parsed[exerciseId]) parsed[exerciseId] = {};
    parsed[exerciseId]![language] = code;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore persistence errors
  }
}

const panelByLanguage: Partial<Record<EditorLanguage, LanguagePanelState>> = {};
const selectedLanguage = ref<EditorLanguage>("typescript");

function createPanel(language: EditorLanguage): LanguagePanelState {
  const execution = useExecutionSocket();
  const meta = languageMeta[language];
  const defaultCode = computed(() => getDefaultCode(language));
  const code = ref<string>("");
  const submitting = ref(false);

  if (import.meta.client) {
    code.value = loadStoredCode(exerciseId, language, defaultCode.value);
  } else {
    code.value = defaultCode.value;
  }

  watch(defaultCode, (val) => {
    if (!code.value) {
      if (import.meta.client) {
        code.value = loadStoredCode(exerciseId, language, val);
      } else {
        code.value = val;
      }
    }
  });

  if (import.meta.client) {
    watch(
      code,
      (val) => {
        saveCode(exerciseId, language, val);
      },
      { flush: "post" }
    );
  }

  return {
    language,
    labelKey: meta.labelKey,
    monacoLanguage: meta.monacoLanguage,
    code,
    submitting,
    execution,
  };
}

function ensurePanel(language: EditorLanguage): LanguagePanelState {
  const existing = panelByLanguage[language];
  if (existing) return existing;
  const panel = createPanel(language);
  panelByLanguage[language] = panel;
  return panel;
}

// Initialize with TypeScript panel available
ensurePanel("typescript");

const currentPanel = computed(() => ensurePanel(selectedLanguage.value));

const currentCode = computed({
  get: () => currentPanel.value.code.value,
  set: (val: string) => {
    currentPanel.value.code.value = val;
  },
});

const isSubmitting = computed(() => currentPanel.value.submitting.value);

const languageSelectItems = computed(() =>
  AVAILABLE_LANGUAGES.map((lang) => ({
    value: lang,
    label: t(languageMeta[lang].labelKey),
  }))
);

const renderedDescription = computed(() => {
  if (!exercise.value) return "";
  return exercise.value.description
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/```([^`]+)```/g, "<pre><code>$1</code></pre>")
    .replace(/\n/g, "<br>");
});

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: "on" as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
};

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return "success";
    case "medium":
      return "warning";
    case "hard":
      return "error";
    default:
      return "neutral";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "idle":
      return "neutral";
    case "compiling":
    case "running":
      return "info";
    case "completed":
      return "success";
    case "failed":
      return "error";
    default:
      return "neutral";
  }
}

function resetCode(language: EditorLanguage) {
  const panel = ensurePanel(language);
  panel.code.value = getDefaultCode(language);
  panel.execution.reset();
}

async function submitCode(language: EditorLanguage) {
  if (!exercise.value) return;
  const panel = ensurePanel(language);

  panel.submitting.value = true;
  panel.execution.reset();

  // Generate a job ID upfront so we can subscribe before submitting
  const jobId = crypto.randomUUID();

  try {
    // Subscribe to WebSocket FIRST to receive live updates
    await panel.execution.subscribe(jobId, language);
    panel.execution.setCompiling();

    // Now submit the job with the same jobId
    const response = await fetch(`${config.public.apiBaseUrl}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        exerciseId: exercise.value.id,
        language,
        code: panel.code.value,
      }),
    });

    const data = await response.json();

    // The WebSocket should handle live updates, but if it fails
    // we can still use the REST response as fallback
    if (data.status === "failed" && !panel.execution.state.finalResult) {
      panel.execution.setError(data.error || t("execution.genericError"));
    }
  } catch (err) {
    console.error("Submit error:", err);
    panel.execution.setError(
      err instanceof Error ? err.message : t("execution.genericError")
    );
  } finally {
    panel.submitting.value = false;
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
