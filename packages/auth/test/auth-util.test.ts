import { fetchWithRefreshToken } from "../src/authentication";
import { decodeJWT } from "../src/decodeJWT";
import { FetchError } from "../src/errors";
import { epochAtSecondsFromNow, epochTimeIsPast } from "../src/timeUtils";
import type { InternalConfig } from "../src/types";

const authConfig: InternalConfig = {
	autoLogin: false,
	oidc: false,
	userInfo: false,
	userInfoRequestCredentials: "same-origin",
	clientId: "myClientID",
	authorizationEndpoint: "myAuthEndpoint",
	tokenEndpoint: "myTokenEndpoint",
	redirectUri: "http://localhost:5173/",
	scope: "someScope openid",
	clearURL: false,
	storage: "local",
	refreshTokenExpiryStrategy: "renewable",
	storageKeyPrefix: "ROCP_",
	refreshWithScope: true,
	loginMethod: "redirect",
	extraTokenParameters: {
		prompt: true,
		client_id: "anotherClientId",
		testKey: "test Value",
	},
	tokenRequestCredentials: "same-origin",
};

test("decode a JWT token", () => {
	const tokenData = decodeJWT(
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.Sfl",
	);
	expect(tokenData?.name).toBe("John Doe");
});

test("decode a non-JWT token", () => {
	console.error = vi.fn();
	expect(() => {
		decodeJWT("somethingStringWhateverThis is not a JWT");
	}).toThrow();
});

test("check if expired token has expired", () => {
	const willExpireAt = epochAtSecondsFromNow(-5); // Expired 5 seconds ago
	const hasExpired = epochTimeIsPast(willExpireAt);
	expect(hasExpired).toBe(true);
});

test("check if still valid token inside buffer has expired", () => {
	const willExpireAt = epochAtSecondsFromNow(5); // Will expire in 5 seconds
	const hasExpired = epochTimeIsPast(willExpireAt);
	expect(hasExpired).toBe(false);
});

test("expire time as number gets correctly converted", () => {
	const expectedEpoch = Math.round(Date.now() / 1000 + 55555);
	const epochSumCalculated = epochAtSecondsFromNow(55555);
	expect(expectedEpoch).toBe(epochSumCalculated);
});

test("expire time as int gets correctly converted", () => {
	const expectedEpoch = Math.round(Date.now() / 1000 + 55555);
	const epochSumCalculated = epochAtSecondsFromNow(55555);
	expect(expectedEpoch).toBe(epochSumCalculated);
});

test("check if still valid token outside buffer has expired", () => {
	const willExpireAt = epochAtSecondsFromNow(301); // Will expire in 5min
	const hasExpired = epochTimeIsPast(willExpireAt);
	expect(hasExpired).toBe(false);
});

test("failed refresh fetch raises FetchError", async () => {
	// @ts-ignore
	global.fetch = vi.fn(() =>
		Promise.resolve({
			ok: false,
			status: 400,
			statusText: "Bad request",
			text: async () => "Failed to refresh token error body",
		}),
	);
	await expect(
		fetchWithRefreshToken({ config: authConfig, refreshToken: "" }),
	).rejects.toBeInstanceOf(FetchError);
});
