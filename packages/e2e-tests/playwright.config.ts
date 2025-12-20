import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for e2e testing using the MSW-powered mock IdP.
 */
export default defineConfig({
	testDir: "./tests",
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,
	fullyParallel: true,
	use: {
		baseURL: "http://localhost:3010",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		// Headless mode for AI/CI environments
		headless: true,
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	webServer: {
		command: "pnpm --filter e2e-test-app start",
		url: "http://localhost:3010",
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});
