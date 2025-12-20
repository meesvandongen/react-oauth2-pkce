import { HttpResponse, http } from "msw";
import { test } from "../playwright.setup";
import { expectAuthError, expectNotAuthenticated, login } from "./helpers";

test("shows error and stays unauthenticated for invalid authorization code", async ({
	page,
	network,
	oidc,
}) => {
	network.use(
		http.get("**/auth", async ({ request }) => {
			const url = new URL(request.url);
			const redirectUri = new URL(url.searchParams.get("redirect_uri")!);
			redirectUri.searchParams.set("code", "invalid-code");
			return HttpResponse.redirect(redirectUri.toString(), 302);
		}),
	);
	await page.goto("/configurable");
	await login(page);
	await expectAuthError(page);
	await expectNotAuthenticated(page);
});
