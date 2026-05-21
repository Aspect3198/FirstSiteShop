import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // index.html is at the project root — Vite default, no change needed
  root: '.',

  // Dev server
  server: {
    port: 5173,
    open: true,
  },

  // Production build
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./Index.html', import.meta.url)),
      },
    },
  },

  // CSS — Vite handles @import natively; PostCSS can be added here if needed
  css: {
    devSourcemap: true,
  },

  // Resolve aliases for cleaner imports (optional, not required)
  resolve: {
    alias: {
      '@state':    '/src/js/state',
      '@utils':    '/src/js/utils',
      '@comp':     '/src/js/components',
      '@admin':    '/src/js/admin',
    },
  },
});