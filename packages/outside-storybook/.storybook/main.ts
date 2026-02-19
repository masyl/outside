import { resolve } from 'path';
import { mergeConfig } from 'vite';
import type { StorybookConfig } from '@storybook/react-vite';

const rootDir = process.cwd();

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  staticDirs: [{ from: '../../..', to: '/' }],
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      define: {
        global: 'globalThis',
        process: 'undefined',
        'process.env.FENGARICONF': 'undefined',
        'process.env': '{}',
      },
      plugins: [
        {
          name: 'outside-storybook-vitest-mocker-shim',
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              if (req.url?.startsWith('/vite-inject-mocker-entry.js')) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/javascript');
                res.end('export {};');
                return;
              }
              next();
            });
          },
        },
      ],
      resolve: {
        alias: [
          {
            find: '@outside/controller-core',
            replacement: resolve(rootDir, '../outside-controller-core/src/index.ts'),
          },
          {
            find: '@outside/test-player',
            replacement: resolve(rootDir, '../outside-test-player/src/index.ts'),
          },
          {
            find: '@outside/simulator',
            replacement: resolve(rootDir, '../outside-simulator/src/index.ts'),
          },
          {
            find: '@outside/inspector-renderer',
            replacement: resolve(rootDir, '../outside-inspector-renderer/src/index.ts'),
          },
          {
            find: '@outside/renderer',
            replacement: resolve(rootDir, '../outside-renderer/src/index.ts'),
          },
          {
            find: /^react\/jsx-runtime$/,
            replacement: resolve(rootDir, 'node_modules/react/jsx-runtime.js'),
          },
          {
            find: /^react\/jsx-dev-runtime$/,
            replacement: resolve(rootDir, 'node_modules/react/jsx-dev-runtime.js'),
          },
          {
            find: /^react$/,
            replacement: resolve(rootDir, 'node_modules/react/index.js'),
          },
          {
            find: /^react-dom$/,
            replacement: resolve(rootDir, 'node_modules/react-dom/index.js'),
          },
          { find: 'pixi.js', replacement: resolve(rootDir, 'node_modules/pixi.js/lib/index.js') },
        ],
        dedupe: ['react', 'react-dom'],
      },
      optimizeDeps: {
        exclude: [
          '@outside/controller-core',
          '@outside/test-player',
          '@outside/simulator',
          '@outside/inspector-renderer',
          '@outside/renderer',
        ],
        esbuildOptions: {
          define: {
            global: 'globalThis',
            process: 'undefined',
            'process.env.FENGARICONF': 'undefined',
            'process.env': '{}',
          },
        },
      },
      server: {
        fs: {
          allow: [resolve(rootDir, '..'), resolve(rootDir, '..', '..')],
        },
      },
    });
  },
};

export default config;
