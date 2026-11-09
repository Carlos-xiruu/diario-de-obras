import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev -- --port 3100', url: 'http://127.0.0.1:3100/login', reuseExistingServer: true, timeout: 120_000 },
})
