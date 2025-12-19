import type { BrowserContext } from "@playwright/test";
import { expect, test } from "../playwright.setup";
import {
	expectAuthenticated,
	expectNotAuthenticated,
	login,
	logout,
} from "./helpers";

test("shares authentication across tabs", async ({ context, page }) => {
	await page.goto("/localstorage");
	await login(page);
	await expectAuthenticated(page);

	const page2 = await context.newPage();
	await page2.goto("/localstorage");
	await expectAuthenticated(page2);
});

test("syncs logout across tabs", async ({ context, page }) => {
	await page.goto("/localstorage");
	await login(page);
	await expectAuthenticated(page);

	const page2 = await context.newPage();
	await page2.goto("/localstorage");
	await expectAuthenticated(page2);

	await logout(page);

	await page2.reload();
	await expectNotAuthenticated(page2);
});

test("does not share sessionStorage between tabs", async ({
	context,
	page,
}) => {
	await page.goto("/basic");
	await login(page);
	await expectAuthenticated(page);

	const page2 = await context.newPage();
	await page2.goto("/basic");
	await expectNotAuthenticated(page2);
});
