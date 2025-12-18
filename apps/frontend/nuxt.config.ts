// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@nuxtjs/supabase',
  ],

  css: ['~/assets/css/main.css'],

  // i18n configuration
  i18n: {
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
    ],
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'prefix_except_default',
  },

  // Supabase configuration
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: ['/dashboard(/*)?'],
      exclude: ['/', '/register'],
    },
  },

  // Runtime config for API URL
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    },
  },

  // Dev server port (control-plane uses 3000)
  devServer: {
    port: 3001,
  },
})
