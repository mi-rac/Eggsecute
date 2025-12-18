<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mb-4" />
    <h1 class="text-2xl font-bold mb-2">
      Email Confirmed!
    </h1>
    <p class="text-gray-600 dark:text-gray-400 mb-8">
      Your email has been verified. You can now access your dashboard.
    </p>
    <NuxtLink to="/dashboard">
      <UButton size="lg">
        {{ $t('nav.dashboard') }}
      </UButton>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
// This page handles the OAuth/email confirmation callback
// The @nuxtjs/supabase module automatically handles the token exchange
</script>

