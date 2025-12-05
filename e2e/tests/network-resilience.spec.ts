import { test } from "../playwright.setup";
import { expectAuthError, expectAuthenticated, login } from "./helpers";

test.describe("Network Resilience", () => {
	test("completes login with slow network", async ({ page }) => {
		await page.goto("/basic");
		await page.route("**/idp/token", async (route) => {
			await new Promise((r) => setTimeout(r, 100));
			await route.continue();
		});

		await login(page);
		await expectAuthenticated(page);
	});

	test("shows error when token endpoint returns 401", async ({ page }) => {
		await page.route("**/idp/token", async (route) => {
			await route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({ error: "unauthorized_client" }),
			});
		});

		await page.goto("/basic?code=fake&state=fake");
		await expectAuthError(page);
	});

	test("shows error for malformed JSON response", async ({ page }) => {
		await page.route("**/idp/token", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: "not valid json {{{",
			});
		});

		await page.goto("/basic?code=fake&state=fake");
		await expectAuthError(page);
	});

	test("shows error for empty response", async ({ page }) => {
		await page.route("**/idp/token", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: "",
			});
		});

		await page.goto("/basic?code=fake&state=fake");
		await expectAuthError(page);
	});

	test("shows error for HTML error page", async ({ page }) => {
		await page.route("**/idp/token", async (route) => {
			await route.fulfill({
				status: 500,
				contentType: "text/html",
				body: "<h1>Error</h1>",
			});
		});

		await page.goto("/basic?code=fake&state=fake");
		await expectAuthError(page);
	});

	test("shows error from authorization endpoint", async ({ page }) => {
		await page.goto(
			"/basic?error=access_denied&error_description=User%20denied",
		);
		await expectAuthError(page);
	});
});
