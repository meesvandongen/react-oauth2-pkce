import { defineConfig, devices } from '@playwright/test'
import { join } from 'path'

/**
 * Playwright configuration for e2e testing with Dex OAuth provider.
 * These tests are designed to run without human interaction (AI-friendly).
 */
export default defineConfig({
  testDir: './e2e/tests',
  globalSetup: join(__dirname, 'e2e/global-setup.ts'),
  globalTeardown: join(__dirname, 'e2e/global-teardown.ts'),
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for OAuth state consistency
  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Headless mode for AI/CI environments
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server configuration - starts the test app before running tests
  webServer: {
    command: 'cd e2e/test-app && npx vite --port 3010 --host',
    url: 'http://localhost:3010',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
