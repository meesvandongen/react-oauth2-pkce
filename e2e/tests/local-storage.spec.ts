import { expect, test } from "../playwright.setup";
import { expectAuthenticated, login, logout } from "./helpers";

test.describe("Local Storage", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/localstorage");
	});

	test("displays storage contents after login", async ({ page }) => {
		await login(page);
		const storageText = await page
			.getByTestId("storage-contents")
			.textContent();
		expect(storageText).toContain("localstorage_token");
	});

	test("clears storage on logout", async ({ page }) => {
		await login(page);
		await logout(page);
		await expect(page.getByTestId("token-data")).not.toBeVisible();
	});

	test("persists authentication in new tab", async ({ context }) => {
		const page1 = await context.newPage();
		await page1.goto("http://localhost:3010/localstorage");
		await login(page1);

		const page2 = await context.newPage();
		await page2.goto("http://localhost:3010/localstorage");
		await expectAuthenticated(page2);
	});
});
