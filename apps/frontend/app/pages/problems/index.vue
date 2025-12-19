<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">{{ $t('problems.title') }}</h1>
    
    <div v-if="pending" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8" />
    </div>

    <div v-else-if="error" class="text-red-500">
      {{ $t('common.error') }}: {{ error.message }}
    </div>

    <div v-else class="grid gap-4">
      <UCard v-for="problem in problems" :key="problem.id" class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <NuxtLink :to="`/problems/${problem.id}`" class="text-xl font-semibold hover:text-primary">
              {{ problem.title }}
            </NuxtLink>
            <p class="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              {{ problem.description }}
            </p>
          </div>
          <div class="flex items-center gap-4">
            <UBadge
              :color="getDifficultyColor(problem.difficulty)"
              variant="subtle"
            >
              {{ $t(`problems.difficulty.${problem.difficulty}`) }}
            </UBadge>
            <UButton
              :to="`/problems/${problem.id}`"
              color="primary"
              variant="soft"
            >
              {{ $t('problems.solve') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

interface ProblemSummary {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

const { data: problems, pending, error } = await useFetch<ProblemSummary[]>(
  `${config.public.apiBaseUrl}/problems`
);

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 'success';
    case 'medium': return 'warning';
    case 'hard': return 'error';
    default: return 'neutral';
  }
}
</script>

