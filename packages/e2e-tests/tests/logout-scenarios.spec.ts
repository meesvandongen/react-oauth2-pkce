import { HttpResponse, http } from "msw";
import { expect, test } from "../playwright.setup";
import {
	expectAuthenticated,
	expectNoAuthError,
	expectNotAuthenticated,
	login,
	logout,
} from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/configurable?logout=true");
});

test("can log out", async ({ page }) => {
	await login(page);
	await expectAuthenticated(page);
	await logout(page);
	await expectNoAuthError(page);
});

test("handles logout when not logged in", async ({ page }) => {
	await expectNotAuthenticated(page);
	await logout(page);
	await expectNoAuthError(page);
	await expectNotAuthenticated(page);
});

test("logs out with hint parameter", async ({ page, network }) => {
	let seenLogoutHint: string | null = null;

	network.use(
		http.get("**/logout", ({ request }) => {
			const url = new URL(request.url);
			seenLogoutHint = url.searchParams.get("logout_hint");

			const redirectTo =
				url.searchParams.get("post_logout_redirect_uri") ??
				"http://localhost:3010/configurable?logout=true";
			return HttpResponse.redirect(redirectTo, 302);
		}),
	);

	await login(page);
	await page.getByTestId("logout-with-hint-button").click();
	await expect.poll(() => seenLogoutHint).toBe("user@example.com");
	await expectNotAuthenticated(page);
});

test("logs out with full parameters", async ({ page, network }) => {
	let seenState: string | null = null;
	let seenLogoutHint: string | null = null;
	let seenExtraParam: string | null = null;

	network.use(
		http.get("**/logout", ({ request }) => {
			const url = new URL(request.url);
			seenState = url.searchParams.get("state");
			seenLogoutHint = url.searchParams.get("logout_hint");
			seenExtraParam = url.searchParams.get("extra_param");

			const redirectTo =
				url.searchParams.get("post_logout_redirect_uri") ??
				"http://localhost:3010/configurable?logout=true";
			return HttpResponse.redirect(redirectTo, 302);
		}),
	);

	await login(page);
	await page.getByTestId("logout-full-button").click();
	await expect.poll(() => seenState).toBe("state-123");
	await expect.poll(() => seenLogoutHint).toBe("user@example.com");
	await expect.poll(() => seenExtraParam).toBe("value");
	await expectNotAuthenticated(page);
});

test("sends OIDC logout protocol hints", async ({ page, network }) => {
	let seenTokenTypeHint: string | null = null;
	let seenIdTokenHint: string | null = null;
	let seenUiLocales: string | null = null;

	network.use(
		http.get("**/logout", ({ request }) => {
			const url = new URL(request.url);
			seenTokenTypeHint = url.searchParams.get("token_type_hint");
			seenIdTokenHint = url.searchParams.get("id_token_hint");
			seenUiLocales = url.searchParams.get("ui_locales");

			const redirectTo =
				url.searchParams.get("post_logout_redirect_uri") ??
				"http://localhost:3010/configurable?logout=true";
			return HttpResponse.redirect(redirectTo, 302);
		}),
	);

	await login(page);
	await page.getByTestId("logout-button").click();

	await expect.poll(() => seenTokenTypeHint).toBe("refresh_token");
	await expect.poll(() => seenIdTokenHint).toBeTruthy();
	await expect.poll(() => seenUiLocales).toBeTruthy();
	await expectNotAuthenticated(page);
});

test("uses configured logoutRedirect as post_logout_redirect_uri", async ({
	page,
	network,
}) => {
	const customLogoutRedirect = "http://localhost:3010/";
	let seenPostLogoutRedirect: string | null = null;

	network.use(
		http.get("**/logout", ({ request }) => {
			const url = new URL(request.url);
			seenPostLogoutRedirect = url.searchParams.get("post_logout_redirect_uri");
			return HttpResponse.redirect(customLogoutRedirect, 302);
		}),
	);

	await page.goto(
		`/configurable?logout=true&logoutRedirect=${encodeURIComponent(customLogoutRedirect)}`,
	);
	await login(page);
	await page.getByTestId("logout-button").click();

	await expect.poll(() => seenPostLogoutRedirect).toBe(customLogoutRedirect);
	await expect(page).toHaveURL(customLogoutRedirect);
});

test("stays on same page after logout", async ({ page }) => {
	await login(page);
	await logout(page);
	expect(page.url()).toContain("/configurable");
});
