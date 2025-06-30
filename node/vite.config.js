import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig(({ command, mode }) => {
  const isElectron = process.env.ELECTRON === 'true' || command === 'build';
  const isCI = process.env.CI === 'true';

  console.log('🔧 Vite Config Debug:', {
    command,
    mode,
    isElectron,
    isCI,
    nodeEnv: process.env.NODE_ENV
  });

  return {
    // Set base to relative paths for Electron
    base: isElectron ? './' : '/',

    server: {
      allowedHosts: true,
      port: 5173
    },

    plugins: [
      vue(),
      // Only enable dev tools in development and not in Electron build or CI
      !isElectron && !isCI && vueDevTools(),
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
      // Prevent interactive prompts in CI
      minify: 'esbuild',
      rollupOptions: {
        // Don't suppress warnings in CI - let them show
        output: {
          // Ensure consistent asset naming
          assetFileNames: 'assets/[name].[hash].[ext]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js'
        }
      }
    },

    // Prevent Vite from clearing the screen in Electron mode or CI
    clearScreen: false,

    // IMPORTANT: Don't suppress logs in CI - we need to see what's happening
    logLevel: 'info'
  };
});
