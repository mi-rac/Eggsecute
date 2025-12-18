<template>
  <div>
    <h1 class="text-3xl font-bold mb-2">
      {{ $t('dashboard.title') }}
    </h1>
    <p class="text-gray-600 dark:text-gray-400 mb-8">
      {{ $t('dashboard.welcome', { email: user?.email }) }}
    </p>

    <UCard>
      <template #header>
        <h2 class="text-xl font-semibold">
          {{ $t('dashboard.healthCheck') }}
        </h2>
      </template>

      <div class="space-y-4">
        <UButton @click="checkHealth" :loading="checking">
          {{ checking ? $t('dashboard.checking') : $t('dashboard.checkHealth') }}
        </UButton>

        <div v-if="healthResult" class="mt-4 p-4 rounded-lg" :class="healthResult.ok ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
          <div class="flex items-center gap-2">
            <UIcon :name="healthResult.ok ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" :class="healthResult.ok ? 'text-green-500' : 'text-red-500'" />
            <span class="font-medium">
              {{ $t('dashboard.healthStatus') }}: {{ healthResult.ok ? $t('dashboard.healthy') : $t('dashboard.unhealthy') }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {{ $t('dashboard.lastChecked', { time: healthResult.checkedAt }) }}
          </p>
          <pre v-if="healthResult.data" class="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">{{ JSON.stringify(healthResult.data, null, 2) }}</pre>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const user = useSupabaseUser()
const config = useRuntimeConfig()
const { t } = useI18n()
const toast = useToast()

const checking = ref(false)
const healthResult = ref<{
  ok: boolean
  data?: Record<string, unknown>
  checkedAt: string
} | null>(null)

async function checkHealth() {
  checking.value = true
  try {
    const response = await fetch(`${config.public.apiBaseUrl}/health`)
    const data = await response.json()

    healthResult.value = {
      ok: response.ok,
      data,
      checkedAt: new Date().toLocaleTimeString(),
    }
  } catch (error) {
    healthResult.value = {
      ok: false,
      checkedAt: new Date().toLocaleTimeString(),
    }
    toast.add({
      title: t('common.error'),
      description: 'Could not connect to API',
      color: 'error',
    })
  } finally {
    checking.value = false
  }
}
</script>

