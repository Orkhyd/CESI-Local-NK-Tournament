// In node/vitest.config.js

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path'; // Needed for path.resolve

export default defineConfig({
  plugins: [
    vue(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/tests/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: [
      // './src/setupTests.js', // Uncomment if you have a setup file
    ],
    css: true,
  },
  // ✅ THIS IS THE FIX: Add resolve.alias configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Make sure this path is correct
    },
  },
});
