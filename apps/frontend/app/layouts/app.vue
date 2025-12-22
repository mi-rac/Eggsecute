<template>
  <UDashboardGroup storage="local" storage-key="main-layout">
    <UDashboardSidebar collapsible resizable :ui="{ footer: 'border-t border-default' }">
      <template #header="{ collapsed }">
        <UIcon name="i-simple-icons-nuxtdotjs" class="size-5 text-primary shrink-0" />
        <span v-if="!collapsed" class="font-semibold truncate">
          {{ $t('app.name') }}
        </span>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          orientation="vertical"
          :items="mainNavItems"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="w-full">
          <template v-if="user">
            <UButton
              color="neutral"
              variant="ghost"
              class="w-full justify-start"
              :block="collapsed"
              @click="handleLogout"
            >
              <span v-if="!collapsed">
                {{ $t('nav.logout') }}
              </span>
            </UButton>
          </template>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { t } = useI18n()
const toast = useToast()

const mainNavItems = computed<NavigationMenuItem[]>(() => [
  {
    label: t('nav.dashboard'),
    icon: 'i-lucide-box',
    to: '/dashboard',
  },
  {
    label: t('nav.library'),
    icon: 'i-lucide-book-open',
    to: '/library',
  },
])

async function handleLogout() {
  await supabase.auth.signOut()
  toast.add({
    title: t('common.success'),
    description: t('auth.logoutSuccess'),
    color: 'success',
  })
  navigateTo('/')
}
</script>

