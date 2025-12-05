import type { BrowserContext } from "@playwright/test";
import { expect, test } from "../playwright.setup";
import {
	expectAuthenticated,
	expectNotAuthenticated,
	login,
	logout,
} from "./helpers";

test.describe("Multi-Tab with localStorage", () => {
	let context: BrowserContext;

	test.beforeEach(async ({ browser, network }) => {
		context = await browser.newContext();
		await network.attachToContext(context);
	});

	test.afterEach(async () => {
		await context.close();
	});

	test("shares authentication across tabs", async () => {
		const page1 = await context.newPage();
		await page1.goto("http://localhost:3010/multitab");
		await login(page1);

		const page2 = await context.newPage();
		await page2.goto("http://localhost:3010/multitab");
		await expectAuthenticated(page2);
	});

	test("syncs logout across tabs", async () => {
		const page1 = await context.newPage();
		await page1.goto("http://localhost:3010/multitab");
		await login(page1);

		const page2 = await context.newPage();
		await page2.goto("http://localhost:3010/multitab");
		await expectAuthenticated(page2);

		await logout(page1);

		await page2.reload();
		await expectNotAuthenticated(page2);
	});

	test("displays storage info on page", async () => {
		const page = await context.newPage();

		await page.goto("http://localhost:3010/multitab");
		await login(page);

		await expect(page.getByTestId("storage-info")).toBeVisible();
	});
});

test.describe("Session Storage Tab Isolation", () => {
	test("does not share sessionStorage between tabs", async ({
		browser,
		network,
	}) => {
		const context = await browser.newContext();
		await network.attachToContext(context);

		const page1 = await context.newPage();
		await page1.goto("http://localhost:3010/basic");
		await login(page1);

		const page2 = await context.newPage();
		await page2.goto("http://localhost:3010/basic");
		await expectNotAuthenticated(page2);

		await context.close();
	});
});
