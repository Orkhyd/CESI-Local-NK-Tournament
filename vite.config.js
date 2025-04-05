import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: { allowedHosts: true },
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        suppressWarnings: true,
        type: "module"
      },
      workbox: {
        disableDevLogs: true,
        maximumFileSizeToCacheInBytes: 4097152,
        // Remove individual files from includeAssets and use globPatterns instead
        globPatterns: [
          '**/*.{js,css,html,png,jpg,jpeg,svg,ico}',
          // Don't specify individual files here
        ],
        navigateFallback: "/",
        navigateFallbackDenylist: [
          /^\/src\/components\/.*\.vue/,
          /^\/src\/replicache\/services\/Pool\/.*\.js/,
          /^\/src\/functions\/.*\.js/
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/src/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dynamic-components',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      },
      // Remove includeAssets completely
      manifest: {
        name: 'My Awesome App',
        short_name: 'MyApp',
        description: 'My Awesome App description',
        theme_color: '#ffffff',
        display: "fullscreen",
        icons: [
          {
            src: '/pwa-192x192.png', // Make sure paths are correct
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png', // Make sure paths are correct
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
});
