import { expect, test } from "../playwright.setup";
import { expectAuthenticated, expectNotAuthenticated, login } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await page.evaluate(() => {
		window.localStorage.clear();
		window.sessionStorage.clear();
	});
});

test("multiple auth providers on a single page", async ({ page }) => {
	await page.goto("/multi-provider");

	const provider1 = page.getByTestId("provider-1");
	const provider2 = page.getByTestId("provider-2");

	await expectNotAuthenticated(provider1);
	await expectNotAuthenticated(provider2);

	// Log in to provider 1
	await login(provider1);
	await expectAuthenticated(provider1);
	await expectNotAuthenticated(provider2);

	// Log in to provider 2
	await login(provider2);
	await expectAuthenticated(provider1);
	await expectAuthenticated(provider2);

	// Verify storage keys
	const storage = await page.evaluate(() => {
		return JSON.stringify(window.sessionStorage);
	});

	expect(storage).toContain("auth1_token");
	expect(storage).toContain("auth2_token");

	// Log out from provider 1
	await provider1.getByTestId("logout-button").click();
	await expectNotAuthenticated(provider1);
	await expectAuthenticated(provider2);
});

test("multiple auth providers on multiple pages (with config)", async ({
	page,
	context,
}) => {
	// Page 1 with prefix 'p1_'
	await page.goto(
		"/configurable?prefix=p1_&storage=local&autoLogin=false&clearURL=false",
	);
	await login(page);
	await expectAuthenticated(page);

	// Page 2 with prefix 'p2_'
	const page2 = await context.newPage();
	await page2.goto(
		"/configurable?prefix=p2_&storage=local&autoLogin=false&clearURL=false",
	);
	await expectNotAuthenticated(page2);

	await login(page2);
	await expectAuthenticated(page2);

	// Verify both are authenticated and have different storage keys
	const storage = await page.evaluate(() => {
		return JSON.stringify(window.localStorage);
	});

	expect(storage).toContain("p1_token");
	expect(storage).toContain("p2_token");

	// Reload page 1 and ensure it's still authenticated
	await page.reload();
	await expectAuthenticated(page);

	// Log out from page 2
	await page2.getByTestId("logout-button").click();
	await expectNotAuthenticated(page2);

	// Page 1 should still be authenticated
	await page.reload();
	await expectAuthenticated(page);
});
