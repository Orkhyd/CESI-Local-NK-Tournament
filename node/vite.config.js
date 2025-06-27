import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig(({ command, mode }) => {
  const isElectron = process.env.ELECTRON === 'true' || command === 'build';

  return {
    // Set base to relative paths for Electron
    base: isElectron ? './' : '/',

    server: {
      allowedHosts: true,
      port: 5173
    },

    plugins: [
      vue(),
      // Only enable dev tools in development and not in Electron build
      !isElectron && vueDevTools(),
      // Remove PWA plugin for Electron - it conflicts with Electron
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },

    build: {
      // Important for Electron: ensure assets are bundled correctly
      outDir: 'dist',
      emptyOutDir: true,
      // Don't inline assets for Electron
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          // Ensure consistent asset naming
          assetFileNames: 'assets/[name].[hash].[ext]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js'
        }
      }
    },

    // Prevent Vite from clearing the screen in Electron mode
    clearScreen: !isElectron
  };
});
