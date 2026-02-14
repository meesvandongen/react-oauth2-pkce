import { waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { createAuth } from "../../src";

// @ts-ignore
global.fetch = vi.fn();

describe("userinfo", () => {
	test("fetchUserInfo uses opaque access token and updates snapshot", async () => {
		localStorage.setItem("ROCP_token", JSON.stringify("opaque-access-token"));
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

		const core = createAuth({
			autoLogin: false,
			clientId: "myClientID",
			authorizationEndpoint: "myAuthEndpoint",
			tokenEndpoint: "myTokenEndpoint",
			redirectUri: "http://localhost/",
			userInfoEndpoint: "myUserInfoEndpoint",
			decodeToken: true,
		});

		await core.fetchUserInfo();

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith("myUserInfoEndpoint", {
				method: "GET",
				headers: {
					Authorization: "Bearer opaque-access-token",
					Accept: "application/json",
				},
				credentials: "same-origin",
			});
		});

		const snapshot = core.getSnapshot();
		expect(snapshot.userInfo?.sub).toBe("123");
		expect(snapshot.userInfo?.email).toBe("a@b.c");
		// access token is opaque -> no decoded JWT data
		expect(snapshot.tokenData).toBeUndefined();
	});

	test("does not warn when decodeToken=true and access token is opaque", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		localStorage.setItem("ROCP_token", JSON.stringify("opaque-access-token"));
		localStorage.setItem("ROCP_tokenExpire", JSON.stringify(9999999999));
		createAuth({
			autoLogin: false,
			clientId: "myClientID",
			authorizationEndpoint: "myAuthEndpoint",
			tokenEndpoint: "myTokenEndpoint",
			redirectUri: "http://localhost/",
			decodeToken: true,
		});

		// Wait for Auth's queued microtask initial load.
		await Promise.resolve();

		expect(warn).not.toHaveBeenCalled();
	});
});
