import { HttpResponse, http } from "msw";
import { expect, test } from "../playwright.setup";
import { expectAuthenticated, login } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/configurable?logout=true");
});

test("logs in with default state from config", async ({ page }) => {
	await login(page);
	await expectAuthenticated(page);
});

test("logs in with custom state passed to logIn", async ({ page }) => {
	await page.getByTestId("login-custom-state-button").click();
	await expectAuthenticated(page);
	await expect(page.getByTestId("token-data")).toHaveText(
		/login-custom-state-button/,
	);
});

test("logs out with custom state", async ({ page, network }) => {
	network.use(
		http.get(`**/logout`, ({ request }) => {
			const url = new URL(request.url);

			return HttpResponse.text(url.searchParams.get("state"));
		}),
	);

	await login(page);
	await expectAuthenticated(page);
	await page.getByTestId("logout-with-state-button").click();
	await expect(page.getByText("logout-with-state-button")).toBeVisible();
});
