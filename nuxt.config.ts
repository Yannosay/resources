export default defineNuxtConfig({
  css: ['~/assets/css/main.scss'],

  runtimeConfig: {
    bootstrapToken: '',
    public: {
      siteUrl: 'https://resources.yannosay.com',
      maxUploadBytes: 26214400
    }
  },

  routeRules: {
    '/': { prerender: false },
    '/about': { prerender: true },
    '/contact': { prerender: true },
    '/legal/**': { prerender: true },
    '/browse/**': { ssr: true },
    '/resource/**': { ssr: true },
    '/u/**': { ssr: true },
    '/admin/**': { ssr: false, headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/api/admin/**': { headers: { 'cache-control': 'no-store' } },
    '/api/auth/**': { headers: { 'cache-control': 'no-store' } },
    '/api/public/**': { headers: { 'cache-control': 'no-store' } }
  },

  app: {
    head: {
      titleTemplate: '%s | Yannosay Resources',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0a0a0b' },
        { name: 'description', content: 'Free resources published by Yannosay Productions.' },
        { property: 'og:site_name', content: 'Yannosay Resources' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/og/og-default.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: '/og/og-default.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/logo.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icon-512.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/Unbounded-VariableFont_wght.woff2', crossorigin: 'anonymous' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/DMSerifDisplay-Regular.woff2', crossorigin: 'anonymous' }
      ]
    }
  },

  nitro: {
    preset: 'cloudflare-pages',
    cloudflare: { nodeCompat: true }
  },

  compatibilityDate: '2026-05-30',

  components: false
})