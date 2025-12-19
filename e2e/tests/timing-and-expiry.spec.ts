import { HttpResponse, http } from "msw";
import { TokenEndpointSuccess } from "../msw/mockOidcProvider";
import { expect, test } from "../playwright.setup";
import { expectAuthenticated, login } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/basic");
});

test("Opaque tokens refresh after expiry", async ({ page, network }) => {
	network.use(
		http.post("**/token", (req) => {
			return HttpResponse.json<TokenEndpointSuccess>({
				access_token: "initial-access-token",
				refresh_token: "initial-refresh-token",
				expires_in: 5 * 60,
				token_type: "Bearer",
				id_token: "initial-id-token",
				scope: "openid profile email",
			});
		}),
	);

	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	await expect(page.getByTestId("access-token")).toHaveText(
		"initial-access-token",
	);
	await expect(page.getByTestId("id-token")).toHaveText("initial-id-token");

	network.use(
		http.post("**/token", (req) => {
			return HttpResponse.json<TokenEndpointSuccess>({
				access_token: "new-access-token",
				refresh_token: "new-refresh-token",
				expires_in: 5 * 60,
				token_type: "Bearer",
				id_token: "new-id-token",
				scope: "openid profile email",
			});
		}),
	);

	await page.clock.fastForward("06:00");

	await expect(page.getByTestId("access-token")).toHaveText("new-access-token");
	await expect(page.getByTestId("id-token")).toHaveText("new-id-token");
});
