import type { Page } from "@playwright/test";
import { HttpResponse, http } from "msw";
import { expect, test } from "../playwright.setup";
import { expectAuthenticated, login } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/configurable?extraParams=true&logout=true");
});

async function parseTokenData(page: Page) {
	const tokenText = await page.getByTestId("token-data").textContent();
	return JSON.parse(tokenText || "{}");
}

test("includes extra /auth param from config", async ({ page }) => {
	await login(page);
	await expectAuthenticated(page);

	const parsedTokenData = await parseTokenData(page);
	expect(parsedTokenData.authParameters.custom_auth_param).toBe(
		"custom_auth_param",
	);
});

test("includes extra /token param from config", async ({ page }) => {
	await login(page);
	await expectAuthenticated(page);

	const parsedTokenData = await parseTokenData(page);
	expect(parsedTokenData.tokenParams.custom_token_param).toBe(
		"custom_token_param",
	);
});

test("includes extra /logout param from config", async ({ page, network }) => {
	network.use(
		http.get(`**/logout`, ({ request }) => {
			const url = new URL(request.url);

			return HttpResponse.text(url.searchParams.get("custom_logout_param"));
		}),
	);
	await login(page);
	await expectAuthenticated(page);

	await page.getByTestId("logout-button").click();

	await expect(page.getByText("custom_logout_param")).toBeVisible();
});

test("includes extra param added from button", async ({ page, network }) => {
	await page.getByTestId("login-extra-param-button").click();
	await expectAuthenticated(page);

	const parsedTokenData = await parseTokenData(page);
	expect(parsedTokenData.authParameters.custom_button_param).toBe(
		"extra-param-from-button",
	);
	expect(parsedTokenData.authParameters.custom_auth_param).toBe(
		"custom_auth_param",
	);
});
