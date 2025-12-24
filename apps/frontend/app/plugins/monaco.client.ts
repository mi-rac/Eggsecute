import { loader } from '@guolao/vue-monaco-editor'

export default defineNuxtPlugin(() => {
  // Configure Monaco to load from CDN for faster initial load
  loader.config({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.0/min/vs',
    },
  })
})

