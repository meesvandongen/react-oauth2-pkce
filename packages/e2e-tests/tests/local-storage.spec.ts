import { Page } from "@playwright/test";
import { expect, test } from "../playwright.setup";
import { login, logout } from "./helpers";

test("displays storage contents after login", async ({ page }) => {
	await page.goto("/configurable?storage=local");
	await expectPageToNotHaveTokenInStorage(page);
	await login(page);
	await expectPageToHaveTokenInStorage(page);
});

test("clears storage on logout", async ({ page }) => {
	await page.goto("/configurable?storage=local");
	await expectPageToNotHaveTokenInStorage(page);
	await login(page);
	await expectPageToHaveTokenInStorage(page);
	await logout(page);
	await expectPageToNotHaveTokenInStorage(page);
});

async function expectPageToHaveTokenInStorage(page: Page) {
	await expect(page.getByTestId("local-storage-entries")).toHaveText(
		/config_token/,
	);
}

async function expectPageToNotHaveTokenInStorage(page: Page) {
	await expect(page.getByTestId("local-storage-entries")).not.toHaveText(
		/config_token/,
	);
}
