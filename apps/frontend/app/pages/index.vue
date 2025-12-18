<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <h1 class="text-4xl font-bold mb-4">
      {{ $t('home.title') }}
    </h1>
    <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
      {{ $t('home.description') }}
    </p>

    <div class="flex gap-4">
      <NuxtLink to="/register">
        <UButton size="lg">{{ $t('home.getStarted') }}</UButton>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})
</script>

