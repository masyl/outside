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
      resolve: {
        alias: {
          '@outside/simulator': resolve(rootDir, '../outside-simulator/src/index.ts'),
          '@outside/renderer': resolve(rootDir, '../outside-renderer/src/index.ts'),
        },
      },
      optimizeDeps: {
        exclude: ['@outside/simulator', '@outside/renderer'],
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
