import { resolve } from 'path';
import { mergeConfig } from 'vite';
import type { StorybookConfig } from '@storybook/react-vite';

const rootDir = process.cwd();

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
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
        alias: {
          '@outside/controller-core': resolve(rootDir, '../outside-controller-core/src/index.ts'),
          '@outside/test-player': resolve(rootDir, '../outside-test-player/src/index.ts'),
          '@outside/simulator': resolve(rootDir, '../outside-simulator/src/index.ts'),
          '@outside/renderer': resolve(rootDir, '../outside-renderer/src/index.ts'),
        },
      },
      optimizeDeps: {
        exclude: [
          '@outside/controller-core',
          '@outside/test-player',
          '@outside/simulator',
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
          allow: [resolve(rootDir, '..')],
        },
      },
    });
  },
};

export default config;
