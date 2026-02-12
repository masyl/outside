import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Use simulator source in dev so behavior/ECS changes apply without rebuilding the package
    alias: {
      '@outside/controller-core': resolve(__dirname, '../outside-controller-core/src/index.ts'),
      '@outside/test-player': resolve(__dirname, '../outside-test-player/src/index.ts'),
      '@outside/inspector-renderer': resolve(
        __dirname,
        '../outside-inspector-renderer/src/index.ts'
      ),
      '@outside/simulator': resolve(__dirname, '../outside-simulator/src/index.ts'),
      'pixi.js': resolve(__dirname, 'node_modules/pixi.js/lib/index.js'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
