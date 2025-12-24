<template>
  <UDashboardGroup>
    <UDashboardSidebar
      v-model:collapsed="sidebarCollapsed"
      collapsible
      :ui="{
        header: 'px-2',
        body: 'px-2',
        root: sidebarCollapsed ? 'min-w-12' : 'w-48',
        footer: 'px-0 border-t border-default',
      }"
    >
      <template #header="{ collapsed }">
        <div v-if="!collapsed" class="flex items-center gap-2 w-full">
          <UIcon
            name="i-simple-icons-nuxtdotjs"
            class="size-5 text-primary shrink-0"
          />
          <span class="font-semibold truncate">
            {{ $t("app.name") }}
          </span>
          <UTooltip :text="$t('sidebar.collapse')">
            <UDashboardSidebarCollapse
              variant="subtle"
              size="sm"
              class="ms-auto"
            />
          </UTooltip>
        </div>
        <div v-else class="flex items-center justify-center w-full">
          <UTooltip :text="$t('sidebar.expand')">
            <UDashboardSidebarCollapse variant="subtle" size="sm" />
          </UTooltip>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          orientation="vertical"
          :items="mainNavItems"
          :tooltip="true"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="w-full">
          <template v-if="user">
            <template v-if="collapsed">
              <UTooltip :text="$t('sidebar.logout')">
                <UButton
                  color="error"
                  variant="ghost"
                  class="w-full justify-center"
                  block
                  square
                  @click="handleLogout"
                >
                  <UIcon name="i-lucide-log-out" class="size-4" />
                </UButton>
              </UTooltip>
            </template>
            <template v-else>
              <UButton
                color="error"
                variant="ghost"
                class="w-full justify-start"
                @click="handleLogout"
              >
                <UIcon name="i-lucide-log-out" class="size-4" />
                <span class="ml-2">
                  {{ $t("nav.logout") }}
                </span>
              </UButton>
            </template>
          </template>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel
      :ui="{
        body: 'flex flex-col flex-1 overflow-y-auto p-0 sm:p-0 gap-0 sm:gap-0',
      }"
    >
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const sidebarCollapsed = useCookie<boolean>("sidebar-collapsed", {
  default: () => false,
  watch: true,
});

const user = useSupabaseUser();
const supabase = useSupabaseClient();
const { t } = useI18n();
const toast = useToast();

const mainNavItems = computed<NavigationMenuItem[]>(() => [
  {
    label: t("nav.dashboard"),
    icon: "i-lucide-box",
    to: "/dashboard",
  },
  {
    label: t("nav.library"),
    icon: "i-lucide-book-open",
    to: "/library",
  },
]);

async function handleLogout() {
  await supabase.auth.signOut();
  toast.add({
    title: t("common.success"),
    description: t("auth.logoutSuccess"),
    color: "success",
  });
  navigateTo("/");
}
</script>
