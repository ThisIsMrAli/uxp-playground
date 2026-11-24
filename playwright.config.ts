import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4310/',
    viewport: { width: 1600, height: 1000 },
    acceptDownloads: true,
    permissions: ['clipboard-read', 'clipboard-write']
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } } }],
  webServer: {
    command: 'npx vite preview --port 4310 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4310/',
    reuseExistingServer: false,
    timeout: 60_000
  }
});
