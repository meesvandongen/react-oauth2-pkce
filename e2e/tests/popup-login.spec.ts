import type { BrowserContext } from "@playwright/test";
import { expect, test } from "../playwright.setup";
import { expectAuthenticated } from "./helpers";

test.describe("Popup Login", () => {
	let context: BrowserContext;

	test.beforeEach(async ({ browser, network }) => {
		context = await browser.newContext();
		await network.attachToContext(context);
	});

	test.afterEach(async () => {
		await context.close();
	});

	test("opens popup for login", async () => {
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		const popupPromise = context.waitForEvent("page");
		await page.getByTestId("login-popup-button").click();

		const popup = await popupPromise;
		await popup.waitForURL(/.*localhost:5556\/idp.*/);
		expect(popup.url()).toContain("localhost:5556/idp");

		await popup.close();
	});

	test("authenticates via popup", async () => {
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		const popupPromise = context.waitForEvent("page");
		await page.getByTestId("login-popup-button").click();

		const popup = await popupPromise;
		await popup.waitForURL(/.*localhost:5556\/idp.*/);
		await popup.waitForURL(/.*localhost:3010\/popup.*/);
		await popup.waitForEvent("close").catch(() => {});

		await page.reload();
		await expectAuthenticated(page);
	});

	test("supports redirect login as fallback", async () => {
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		await page.getByTestId("login-redirect-button").click();
		await expectAuthenticated(page);
	});
});

test.describe("Popup Blocked Fallback", () => {
	test("falls back to redirect when popup is blocked", async ({
		browser,
		network,
	}) => {
		const context = await browser.newContext();
		await network.attachToContext(context);
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		await page.evaluate(() => {
			window.open = () => null;
		});

		await page.getByTestId("login-popup-button").click();
		await page.waitForURL(/.*localhost:5556\/idp.*/);

		await expectAuthenticated(page);

		await context.close();
	});
});
