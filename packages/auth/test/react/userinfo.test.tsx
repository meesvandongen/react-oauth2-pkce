import { waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { createAuth } from "../../src";

// @ts-ignore
global.fetch = vi.fn();

const jwt =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6ImFAYi5jIiwiaWF0IjoxNTE2MjM5MDIyfQ.Sfl";

describe("userinfo", () => {
	test("with userInfo=true, auth becomes authenticated only after userinfo is loaded", async () => {
		localStorage.setItem("ROCP_token", JSON.stringify(jwt));
		localStorage.setItem("ROCP_tokenExpire", JSON.stringify(9999999999));

		// @ts-ignore
		global.fetch.mockResolvedValueOnce({
			ok: true,
			text: () =>
				Promise.resolve(JSON.stringify({ sub: "123", email: "a@b.c" })),
			status: 200,
			statusText: "OK",
			headers: new Headers({ "content-type": "application/json" }),
		});

		const auth = createAuth({
			autoLogin: false,
			userInfo: true,
			clientId: "myClientID",
			authorizationEndpoint: "myAuthEndpoint",
			tokenEndpoint: "myTokenEndpoint",
			redirectUri: "http://localhost/",
			userInfoEndpoint: "myUserInfoEndpoint",
		});

		expect(auth.getSnapshot().status).toBe("loading");

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith("myUserInfoEndpoint", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${jwt}`,
					Accept: "application/json",
				},
				credentials: "same-origin",
			});
		});

		await waitFor(() => {
			expect(auth.getSnapshot().status).toBe("authenticated");
		});

		const snapshot = auth.getSnapshot();
		expect(snapshot.status).toBe("authenticated");
		if (snapshot.status !== "authenticated") {
			throw new Error("Expected authenticated snapshot in userinfo test");
		}
		expect(snapshot.userInfo!.sub).toBe("123");
		expect(snapshot.userInfo!.email).toBe("a@b.c");
		expect(snapshot.tokenData.sub).toBe("123");
	});

	test("throws when persisted access token is opaque", () => {
		localStorage.setItem("ROCP_token", JSON.stringify("opaque-access-token"));
		localStorage.setItem("ROCP_tokenExpire", JSON.stringify(9999999999));
		expect(() =>
			createAuth({
				autoLogin: false,
				clientId: "myClientID",
				authorizationEndpoint: "myAuthEndpoint",
				tokenEndpoint: "myTokenEndpoint",
				redirectUri: "http://localhost/",
			}),
		).toThrow();
	});
});
