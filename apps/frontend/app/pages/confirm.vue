<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-success mb-4" />
    <h1 class="text-2xl font-bold mb-2">
      {{ $t('auth.emailConfirmed') }}
    </h1>
    <p class="text-gray-600 dark:text-gray-400 mb-8">
      {{ $t('auth.emailConfirmedDescription') }}
    </p>
    <UButton size="lg" @click="navigateTo('/dashboard')">
      {{ $t('auth.proceedToApp') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
// This page handles the email confirmation callback
// The @nuxtjs/supabase module automatically processes the hash tokens
</script>

