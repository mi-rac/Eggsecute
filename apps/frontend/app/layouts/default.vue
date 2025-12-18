<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <UContainer>
      <header class="py-4">
        <nav class="flex items-center justify-between">
          <NuxtLink to="/" class="text-xl font-bold text-primary">
            {{ $t('app.name') }}
          </NuxtLink>

          <div class="flex items-center gap-4">
            <template v-if="user">
              <NuxtLink to="/dashboard">
                <UButton variant="ghost">{{ $t('nav.dashboard') }}</UButton>
              </NuxtLink>
              <UButton variant="soft" color="red" @click="handleLogout">
                {{ $t('nav.logout') }}
              </UButton>
            </template>
            <template v-else>
              <NuxtLink to="/login">
                <UButton variant="ghost">{{ $t('nav.login') }}</UButton>
              </NuxtLink>
              <NuxtLink to="/register">
                <UButton>{{ $t('nav.register') }}</UButton>
              </NuxtLink>
            </template>
          </div>
        </nav>
      </header>

      <main class="py-8">
        <slot />
      </main>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { t } = useI18n()
const toast = useToast()

async function handleLogout() {
  await supabase.auth.signOut()
  toast.add({
    title: t('common.success'),
    description: t('auth.logoutSuccess'),
    color: 'green',
  })
  navigateTo('/')
}
</script>

