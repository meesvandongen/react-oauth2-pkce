import { expect, test } from "../playwright.setup";
import { expectAuthenticated, expectNotAuthenticated, login } from "./helpers";

test.describe("Browser Navigation", () => {
	test("handles back navigation from IdP", async ({ page }) => {
		await page.goto("/basic");
		await page.click('[data-testid="login-button"]');
		await page.waitForURL(/.*localhost:5556\/idp.*/);

		await page.goBack();
		await expect(page.url()).toContain("localhost:3010");
	});

	test("maintains auth when navigating away and back", async ({ page }) => {
		await page.goto("/basic");
		await login(page);
		await expectAuthenticated(page);

		await page.goto("/");
		await page.goto("/basic");
		await expectAuthenticated(page);
	});

	test("handles hash in URL", async ({ page }) => {
		await page.goto("/basic#section");
		await login(page);
		await expectAuthenticated(page);

		expect(page.url()).toContain("#section");
	});
});

test.describe("Route Changes", () => {
	test("ignores unrelated URL parameters", async ({ page }) => {
		await page.goto("/basic?unrelated=param");
		await expectNotAuthenticated(page);

		await login(page);
		await expectAuthenticated(page);
	});
});
