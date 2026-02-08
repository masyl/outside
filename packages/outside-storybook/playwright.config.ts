import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_STORYBOOK_URL || 'http://localhost:6007';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL,
    viewport: { width: 1200, height: 800 },
    headless: true,
  },
});
