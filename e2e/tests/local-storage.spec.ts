import { Page } from "@playwright/test";
import { expect, test } from "../playwright.setup";
import { expectAuthenticated, login, logout } from "./helpers";

test("displays storage contents after login", async ({ page }) => {
	await page.goto("/localstorage");
	await expectPageToNotHaveTokenInStorage(page);
	await login(page);
	await expectPageToHaveTokenInStorage(page);
});

test.skip("clears storage on logout", async ({ page }) => {
	await page.goto("/localstorage");
	await expectPageToNotHaveTokenInStorage(page);
	await login(page);
	await expectPageToHaveTokenInStorage(page);
	await logout(page);
	await expectPageToNotHaveTokenInStorage(page);
});

test("persists authentication in new tab", async ({ context, page }) => {
	await page.goto("http://localhost:3010/localstorage");
	await login(page);
	await expectAuthenticated(page);

	const page2 = await context.newPage();
	await page2.goto("http://localhost:3010/localstorage");
	await expectAuthenticated(page2);
});

async function expectPageToHaveTokenInStorage(page: Page) {
	await expect(page.getByTestId("local-storage-entries")).toHaveText(
		/localstorage_token/,
	);
}

async function expectPageToNotHaveTokenInStorage(page: Page) {
	await expect(page.getByTestId("local-storage-entries")).not.toHaveText(
		/localstorage_token/,
	);
}
