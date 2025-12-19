<template>
  <UApp>
    <NuxtLayout>
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
// Mark document as hydrated once Vue takes over
onMounted(() => {
  document.documentElement.classList.add('hydrated')
})
</script>

<style>
/* Prevent FOUC - hide content until styles load */
html:not(.hydrated) body {
  visibility: hidden;
}
html.hydrated body {
  visibility: visible;
}
</style>
