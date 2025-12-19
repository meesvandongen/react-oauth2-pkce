import { HttpResponse, http } from "msw";
import { expect, test } from "../playwright.setup";
import {
	expectAuthError,
	expectAuthenticated,
	expectNoAuthError,
	expectNotAuthenticated,
	login,
} from "./helpers";

test("handles back navigation from IdP", async ({ page, network }) => {
	network.use(
		http.get("**/auth", async ({ request }) => {
			return HttpResponse.html("<h1>Login Page</h1>");
		}),
	);

	await page.goto("/basic");
	await login(page);
	await page.waitForURL(/.*localhost:5556\/idp.*/);

	await page.goBack();
	await expectNotAuthenticated(page);
	await expectAuthError(page);
});

test("maintains auth when navigating away and back", async ({ page }) => {
	await page.goto("/basic");
	await login(page);
	await expectAuthenticated(page);

	await page.goto("/");
	await page.goto("/basic");
	await expectAuthenticated(page);
});

test("handles hash in URL", async ({ page }) => {
	await page.goto("/basic#section");
	await login(page);
	await expectAuthenticated(page);

	expect(page.url()).toContain("#section");
});

test("ignores unrelated URL parameters", async ({ page }) => {
	await page.goto("/basic?unrelated=param");
	await expectNotAuthenticated(page);

	await login(page);
	await expectAuthenticated(page);
});
