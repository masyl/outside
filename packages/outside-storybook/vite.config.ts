import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Use simulator source in dev so behavior/ECS changes apply without rebuilding the package
    alias: [
      {
        find: '@outside/controller-core',
        replacement: resolve(__dirname, '../outside-controller-core/src/index.ts'),
      },
      {
        find: '@outside/test-player',
        replacement: resolve(__dirname, '../outside-test-player/src/index.ts'),
      },
      {
        find: '@outside/inspector-renderer',
        replacement: resolve(__dirname, '../outside-inspector-renderer/src/index.ts'),
      },
      {
        find: '@outside/simulator',
        replacement: resolve(__dirname, '../outside-simulator/src/index.ts'),
      },
      { find: /^react\/jsx-runtime$/, replacement: resolve(__dirname, 'node_modules/react/jsx-runtime.js') },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      },
      { find: /^react$/, replacement: resolve(__dirname, 'node_modules/react/index.js') },
      { find: /^react-dom$/, replacement: resolve(__dirname, 'node_modules/react-dom/index.js') },
      { find: 'pixi.js', replacement: resolve(__dirname, 'node_modules/pixi.js/lib/index.js') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
