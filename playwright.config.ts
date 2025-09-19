import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 90_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run web:preview',
    url: 'http://localhost:4173',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      EXPO_PUBLIC_E2E: '1',
      // real Supabase envs (will be overridden by GH secrets in CI)
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://clpalmprapjflfabrrde.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscGFsbXByYXBqZmxmYWJycmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTM2ODcsImV4cCI6MjA3MTM2OTY4N30.f7sf3PWwG2DWEwTHtEFoJsIOTxQbNuZbDDhIRQGNvwM',
      EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET: process.env.EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET ?? 'backups',
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
