import { defineConfig, devices } from '@playwright/test';

const PORT = 4322;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/aerolex/`,
    // Locally use the installed Google Chrome; CI installs Playwright's Chromium.
    ...(process.env.CI ? {} : { channel: 'chrome' }),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...(process.env.CI ? {} : { channel: 'chrome' }) }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...(process.env.CI ? {} : { channel: 'chrome' }) }, grep: /@mobile/ },
  ],
  webServer: {
    // --ignore-lock keeps the server in the foreground so Playwright can manage it.
    command: `npx astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/aerolex/en/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
