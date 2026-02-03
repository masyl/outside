import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Use simulator source in dev so behavior/ECS changes apply without rebuilding the package
    alias: {
      '@outside/simulator': resolve(__dirname, '../outside-simulator/src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
