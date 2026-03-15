import type {
	AuthAuthenticatedSnapshotTyped,
	AuthSnapshot,
	TokenData,
} from "../src";
import { createAuth } from "../src";

type Expect<T extends true> = T;
type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? true
		: false;

const baseConfig = {
	autoLogin: false,
	clientId: "myClientID",
	authorizationEndpoint: "myAuthEndpoint",
	tokenEndpoint: "myTokenEndpoint",
	redirectUri: "http://localhost/",
} as const;

const jwtAuth = createAuth(baseConfig);
type JwtSnapshot = ReturnType<typeof jwtAuth.getSnapshot>;
type JwtAuthenticated = Extract<JwtSnapshot, { status: "authenticated" }>;
type JwtSnapshotMatchesExpected = Expect<
	Equal<JwtSnapshot, AuthSnapshot<TokenData, false>>
>;
type JwtAuthenticatedMatchesExpected = Expect<
	Equal<JwtAuthenticated, AuthAuthenticatedSnapshotTyped<TokenData, false>>
>;

const opaqueAuth = createAuth({
	...baseConfig,
	opaqueAccessToken: true,
});
type OpaqueSnapshot = ReturnType<typeof opaqueAuth.getSnapshot>;
type OpaqueAuthenticated = Extract<OpaqueSnapshot, { status: "authenticated" }>;
type OpaqueSnapshotMatchesExpected = Expect<
	Equal<OpaqueSnapshot, AuthSnapshot<TokenData, true>>
>;
type OpaqueAuthenticatedMatchesExpected = Expect<
	Equal<OpaqueAuthenticated, AuthAuthenticatedSnapshotTyped<TokenData, true>>
>;
// @ts-expect-error Opaque authenticated snapshots intentionally omit tokenData.
type OpaqueTokenData = OpaqueAuthenticated["tokenData"];

test("opaque access token type assertions compile", () => {
	expect(true).toBe(true);
});
