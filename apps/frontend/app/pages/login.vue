<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh]">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-center">
          {{ $t('auth.loginTitle') }}
        </h1>
      </template>

      <UForm :state="state" :validate="validate" @submit="handleLogin" class="space-y-4">
        <UFormField :label="$t('auth.email')" name="email">
          <UInput v-model="state.email" type="email" autocomplete="email" />
        </UFormField>

        <UFormField :label="$t('auth.password')" name="password">
          <UInput v-model="state.password" type="password" autocomplete="current-password" />
        </UFormField>

        <UButton type="submit" block :loading="loading">
          {{ loading ? $t('auth.loggingIn') : $t('auth.loginButton') }}
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-gray-600 dark:text-gray-400">
          {{ $t('auth.noAccount') }}
          <NuxtLink to="/register" class="text-primary hover:underline">
            {{ $t('nav.register') }}
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { t } = useI18n()
const toast = useToast()

const loading = ref(false)
const state = reactive({
  email: '',
  password: '',
})

function validate(formState: typeof state) {
  const errors: { path: string; message: string }[] = []
  if (!formState.email) errors.push({ path: 'email', message: t('auth.email') + ' is required' })
  if (!formState.password) errors.push({ path: 'password', message: t('auth.password') + ' is required' })
  return errors
}

async function handleLogin() {
  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: state.email,
      password: state.password,
    })

    if (error) {
      toast.add({
        title: t('common.error'),
        description: t('auth.loginError'),
        color: 'red',
      })
      return
    }

    navigateTo('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

