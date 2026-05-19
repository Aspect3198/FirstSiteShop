import { defineConfig } from 'vite';

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
    outDir:     'dist',
    emptyOutDir: true,
    sourcemap:  false,
    rollupOptions: {
      // Single entry — Vite picks it up from index.html automatically
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