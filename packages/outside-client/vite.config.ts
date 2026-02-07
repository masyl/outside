import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174, // Changed from 3000 to avoid conflict with Express server
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
