import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SIM BK PRO · Bimbingan & Konseling',
        short_name: 'SIM BK PRO',
        description:
          'Aplikasi manajemen bimbingan & konseling sekolah untuk guru BK: catatan konseling, AKPD, prota, dan surat.',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#3949AB',
        background_color: '#F7F8FC',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Data siswa selalu fresh dari jaringan; hanya aset aplikasi yang di-cache
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*supabase.*\/(rest|auth|realtime)\/.*/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      // Dua entry terpisah: "/" untuk PC, "/m/" untuk ponsel.
      // Bundel PC tidak memuat kode mobile, dan sebaliknya.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        mobile: fileURLToPath(new URL('./m/index.html', import.meta.url)),
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
