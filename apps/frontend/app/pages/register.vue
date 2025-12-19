<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh]">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-center">
          {{ $t('auth.registerTitle') }}
        </h1>
      </template>

      <UForm :state="state" :validate="validate" @submit="handleRegister" class="space-y-4">
        <UFormField :label="$t('auth.email')" name="email" class="w-full">
          <UInput v-model="state.email" type="email" autocomplete="email" class="w-full" />
        </UFormField>

        <UFormField :label="$t('auth.password')" name="password" class="w-full">
          <UInput v-model="state.password" type="password" autocomplete="new-password" class="w-full" />
        </UFormField>

        <UFormField :label="$t('auth.confirmPassword')" name="confirmPassword" class="w-full">
          <UInput v-model="state.confirmPassword" type="password" autocomplete="new-password" class="w-full" />
        </UFormField>

        <UButton type="submit" block :loading="loading">
          {{ loading ? $t('auth.registering') : $t('auth.registerButton') }}
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-gray-600 dark:text-gray-400">
          {{ $t('auth.hasAccount') }}
          <NuxtLink to="/login" class="text-primary hover:underline">
            {{ $t('nav.login') }}
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
  confirmPassword: '',
})

function validate(formState: typeof state) {
  const errors: { path: string; message: string }[] = []
  if (!formState.email) errors.push({ path: 'email', message: t('auth.email') + ' is required' })
  if (!formState.password) errors.push({ path: 'password', message: t('auth.password') + ' is required' })
  if (formState.password !== formState.confirmPassword) {
    errors.push({ path: 'confirmPassword', message: t('auth.passwordMismatch') })
  }
  return errors
}

async function handleRegister() {
  loading.value = true
  try {
    const { error } = await supabase.auth.signUp({
      email: state.email,
      password: state.password,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm`,
      },
    })

    if (error) {
      toast.add({
        title: t('common.error'),
        description: t('auth.registerError'),
        color: 'error',
      })
      return
    }

    toast.add({
      title: t('common.success'),
      description: 'Account created! Please check your email to verify.',
      color: 'success',
    })
    navigateTo('/login')
  } finally {
    loading.value = false
  }
}
</script>

