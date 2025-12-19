// Global middleware to detect Supabase email confirmation callback
// and redirect to /confirm page
export default defineNuxtRouteMiddleware((to) => {
  // Only run on client-side and on the home page
  if (import.meta.server) return
  if (to.path !== '/') return

  // Check if URL has Supabase auth hash (access_token, type=signup, etc.)
  // This runs before the hash is processed by @nuxtjs/supabase
  if (typeof window !== 'undefined') {
    const hash = window.location.hash
    if (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=magiclink')) {
      return navigateTo('/confirm' + hash)
    }
  }
})

