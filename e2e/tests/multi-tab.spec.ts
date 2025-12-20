import type { BrowserContext } from "@playwright/test";
import { expect, test } from "../playwright.setup";
import {
	expectAuthenticated,
	expectNotAuthenticated,
	login,
	logout,
} from "./helpers";

test("shares authentication across tabs", async ({ context, page }) => {
	await page.goto("/configurable?storage=local");
	await login(page);
	await expectAuthenticated(page);

	const page2 = await context.newPage();
	await page2.goto("/configurable?storage=local");
	await expectAuthenticated(page2);
});

test("syncs logout across tabs", async ({ context, page }) => {
	await page.goto("/configurable?storage=local&logout=true");
	await login(page);
	await expectAuthenticated(page);

	const page2 = await context.newPage();
	await page2.goto("/configurable?storage=local&logout=true");
	await expectAuthenticated(page2);

	await logout(page);

	await page2.reload();
	await expectNotAuthenticated(page2);
});

test("does not share sessionStorage between tabs", async ({
	context,
	page,
}) => {
	await page.goto("/configurable?storage=session");
	await login(page);
	await expectAuthenticated(page);

	const page2 = await context.newPage();
	await page2.goto("/configurable?storage=session");
	await expectNotAuthenticated(page2);
});
