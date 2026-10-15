import { defineConfig, devices } from '@playwright/test';

// End-to-end tests for sbmadhav.com. They run against the LIVE site and its real dependencies
// by default. Point them elsewhere with BASE_URL, for example a local server of this checkout:
//   node local-server.mjs 8123 &  BASE_URL=http://localhost:8123 npx playwright test
export const BASE_URL = (process.env.BASE_URL || 'https://sbmadhav.com').replace(/\/$/, '');

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 3 : 6,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Reduced motion: no splash, confetti or typing delays, so the games settle fast
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
