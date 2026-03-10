import { defineConfig } from '@playwright/test';

/**
 * Config para E2E desde raíz (scripts/testing/*.spec.ts).
 * Backend y frontend deben estar levantados (iniciar.ps1).
 */
export default defineConfig({
  testDir: './scripts/testing',
  testMatch: /e2e-manager-flows\.spec\.ts/,
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'scripts/testing/playwright-report' }], ['list']],
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
  },
  expect: { timeout: 10000 },
});
