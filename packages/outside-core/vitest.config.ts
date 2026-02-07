/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    // Suppress console logs to keep test output clean
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
      return false;
    },
  },
});
