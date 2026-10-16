import { defineConfig } from '@playwright/test';

// Boots the real backend and frontend dev servers before running the
// e2e suite, so tests exercise the actual totem/counter flows end to end.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: './backend/src',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      cwd: './frontend',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
