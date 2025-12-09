import { HttpResponse, http } from "msw";
import { test } from "../playwright.setup";
import { expectAuthError, expectAuthenticated, login } from "./helpers";

test("shows error when token endpoint returns 401", async ({
	page,
	network,
}) => {
	network.use(
		http.post("**/token", async ({ request }) => {
			return HttpResponse.json(
				{ error: "unauthorized_client" },
				{ status: 401 },
			);
		}),
	);

	await page.goto("/basic");
	await login(page);
	await expectAuthError(page);
});

test("shows error for malformed JSON response", async ({ page, network }) => {
	network.use(
		http.post("**/token", async ({ request }) => {
			return HttpResponse.text("{ invalidJson: true ");
		}),
	);

	await page.goto("/basic");
	await login(page);
	await expectAuthError(page);
});

test("shows error for empty response", async ({ page, network }) => {
	network.use(
		http.post("**/token", async ({ request }) => {
			return new Response(null, { status: 200 });
		}),
	);

	await page.goto("/basic");
	await login(page);
	await expectAuthError(page);
});

test("shows error for HTML error page", async ({ page, network }) => {
	network.use(
		http.post("**/token", async ({ request }) => {
			return HttpResponse.html("<h1>Server Error</h1>", { status: 500 });
		}),
	);
	await page.goto("/basic");
	await login(page);
	await expectAuthError(page);
});

test("shows error from authorization endpoint", async ({ page, network }) => {
	network.use(
		http.get("**/auth", async ({ request }) => {
			const url = new URL(request.url);
			const redirectUri = new URL(url.searchParams.get("redirect_uri")!);
			redirectUri.searchParams.set("error", "access_denied");
			redirectUri.searchParams.set(
				"error_description",
				"The user denied access.",
			);
			return HttpResponse.redirect(redirectUri.toString(), 302);
		}),
	);

	await page.goto("/basic");
	await login(page);
	await expectAuthError(page);
});
