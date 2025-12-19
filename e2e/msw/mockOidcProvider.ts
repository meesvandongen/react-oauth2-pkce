import { createHash, randomBytes } from "node:crypto";
import { calculatePKCECodeChallenge } from "openid-client";

export interface AuthorizationRequestContext {
	clientId: string;
	redirectUri: string;
	scope: string;
	codeChallenge?: string;
	codeChallengeMethod: "S256" | "plain";
	state?: string;
	loginHint?: string;
	headers: Record<string, string>;
	parameters: Record<string, string>;
}

interface AuthorizationGrant extends AuthorizationRequestContext {
	code: string;
	user: MockUser;
}

interface RefreshGrant {
	token: string;
	user: MockUser;
	clientId: string;
	scope: string;
	issuedAt: number;
	authContext: AuthorizationRequestContext;
}

export interface MockUser {
	sub: string;
	email: string;
	name: string;
	preferred_username: string;
	email_verified: boolean;
	locale: string;
}

export interface ProviderOptions {
	issuer?: string;
	accessTokenLifetimeSeconds?: number;
	refreshTokenLifetimeSeconds?: number;
	adjustTokenPayload?: (input: {
		authContext: AuthorizationRequestContext;
		tokenHeaders: Record<string, string>;
		tokenParams: Record<string, string>;
	}) => Promise<Record<string, unknown>>;
}

export interface TokenEndpointSuccess {
	access_token: string;
	token_type: "Bearer";
	expires_in: number;
	scope: string;
	id_token: string;
	refresh_token?: string;
	refresh_expires_in?: number;
}

export class OAuthError extends Error {
	constructor(
		public readonly error: string,
		message: string,
		public readonly status: number = 400,
	) {
		super(message);
		this.name = "OAuthError";
	}

	toJSON() {
		return {
			error: this.error,
			error_description: this.message,
		};
	}
}

const DEFAULT_LOGIN_HINT = "admin@example.com";

export class MockOidcProvider {
	readonly #authorizationCodes = new Map<string, AuthorizationGrant>();
	readonly #refreshGrants = new Map<string, RefreshGrant>();

	public adjustTokenPayload?: (input: {
		authContext: AuthorizationRequestContext;
		tokenHeaders: Record<string, string>;
		tokenParams: Record<string, string>;
	}) => Promise<Record<string, unknown>>;
	public issuer: string;
	public accessTokenLifetimeSeconds: number;
	public refreshTokenLifetimeSeconds: number;
	public refreshTokenRotation = true;
	public refreshTokenReuse = false;

	constructor(options: ProviderOptions = {}) {
		this.issuer = options.issuer ?? "http://localhost:5556/idp";
		this.accessTokenLifetimeSeconds =
			options.accessTokenLifetimeSeconds ?? 60 * 10; // 10 minutes
		this.refreshTokenLifetimeSeconds =
			options.refreshTokenLifetimeSeconds ?? 60 * 60; // 1 hour
		this.adjustTokenPayload =
			options.adjustTokenPayload ??
			(async ({ authContext, tokenParams }) => ({
				authParameters: authContext.parameters,
				tokenParams,
			}));
	}

	public getMetadata() {
		const base = this.issuer;
		return {
			issuer: base,
			authorization_endpoint: `${base}/auth`,
			token_endpoint: `${base}/token`,
			userinfo_endpoint: `${base}/userinfo`,
			end_session_endpoint: `${base}/logout`,
			revocation_endpoint: `${base}/revoke`,
			jwks_uri: `${base}/keys`,
			response_types_supported: ["code"],
			grant_types_supported: ["authorization_code", "refresh_token"],
			code_challenge_methods_supported: ["S256", "plain"],
			id_token_signing_alg_values_supported: ["HS256"],
			token_endpoint_auth_methods_supported: [
				"client_secret_post",
				"client_secret_basic",
			],
			claims_supported: [
				"aud",
				"exp",
				"iat",
				"iss",
				"sub",
				"email",
				"email_verified",
				"name",
				"preferred_username",
			],
		};
	}

	public authorize(request: Request) {
		const url = new URL(request.url);
		const params = url.searchParams;
		const clientId = params.get("client_id");
		const redirectUri = params.get("redirect_uri");
		const responseType = params.get("response_type");

		if (!clientId || !redirectUri) {
			throw new OAuthError(
				"invalid_request",
				"Missing client_id or redirect_uri",
				400,
			);
		}

		if (responseType && responseType !== "code") {
			throw new OAuthError(
				"unsupported_response_type",
				"Only response_type=code is supported",
				400,
			);
		}

		const allParams: Record<string, string> = {};
		for (const [key, value] of params) {
			allParams[key] = value;
		}

		const headers: Record<string, string> = {};
		for (const [key, value] of request.headers) {
			headers[key] = value;
		}

		const grant: AuthorizationRequestContext = {
			clientId,
			redirectUri,
			scope: params.get("scope") ?? "openid profile email",
			codeChallenge: params.get("code_challenge") ?? undefined,
			codeChallengeMethod: (params.get("code_challenge_method") ?? "plain") as
				| "S256"
				| "plain",
			state: params.get("state") ?? undefined,
			loginHint: params.get("login_hint") ?? undefined,
			headers,
			parameters: allParams,
		};

		const code = this.generateCode();
		this.#authorizationCodes.set(code, {
			...grant,
			code,
			user: this.resolveUser(grant.loginHint),
		});

		const redirect = new URL(grant.redirectUri);
		redirect.searchParams.set("code", code);
		if (grant.state) {
			redirect.searchParams.set("state", grant.state);
		}

		return redirect.toString();
	}

	public async issueTokens(request: Request): Promise<TokenEndpointSuccess> {
		const form = new URLSearchParams(await request.text());
		const grantType = form.get("grant_type");

		if (grantType === "authorization_code") {
			return this.exchangeAuthorizationCode(form, request);
		}

		if (grantType === "refresh_token") {
			return this.exchangeRefreshToken(form, request);
		}

		throw new OAuthError(
			"unsupported_grant_type",
			`Unsupported grant_type "${grantType}"`,
			400,
		);
	}

	public createLogoutRedirect(url: URL) {
		const postLogout = url.searchParams.get("post_logout_redirect_uri");
		if (!postLogout) {
			return {
				redirect: `${this.issuer}/logged-out`,
				hasRedirect: false,
			};
		}

		const redirect = new URL(postLogout);
		const state = url.searchParams.get("state");
		if (state) {
			redirect.searchParams.set("state", state);
		}

		return {
			redirect: redirect.toString(),
			hasRedirect: true,
		};
	}

	public getJwks() {
		return {
			keys: [
				{
					kty: "oct",
					kid: "mock-key",
					alg: "HS256",
					k: Buffer.from("mock-secret").toString("base64"),
					use: "sig",
				},
			],
		};
	}

	private async exchangeAuthorizationCode(
		form: URLSearchParams,
		request: Request,
	) {
		const code = form.get("code");
		const codeVerifier = form.get("code_verifier");
		const clientId = form.get("client_id");
		const redirectUri = form.get("redirect_uri");

		if (!code || !codeVerifier || !clientId || !redirectUri) {
			throw new OAuthError(
				"invalid_request",
				"Missing parameters for authorization_code grant",
				400,
			);
		}

		const grant = this.#authorizationCodes.get(code);
		if (!grant) {
			throw new OAuthError(
				"invalid_grant",
				"Authorization code is invalid or already used",
				400,
			);
		}

		if (grant.clientId !== clientId) {
			throw new OAuthError(
				"invalid_grant",
				"Client mismatch for authorization code",
				400,
			);
		}

		if (grant.redirectUri !== redirectUri) {
			throw new OAuthError("invalid_grant", "redirect_uri mismatch", 400);
		}

		if (grant.codeChallenge) {
			await this.assertValidPkce(grant, codeVerifier);
		}

		const tokenParams: Record<string, string> = {};
		for (const [key, value] of form) {
			tokenParams[key] = value;
		}

		const tokenHeaders: Record<string, string> = {};
		for (const [key, value] of request.headers) {
			tokenHeaders[key] = value;
		}

		this.#authorizationCodes.delete(code);
		return this.buildTokenResponse(
			grant.user,
			grant.scope,
			clientId,
			grant,
			tokenHeaders,
			tokenParams,
		);
	}

	private async exchangeRefreshToken(form: URLSearchParams, request: Request) {
		const refreshToken = form.get("refresh_token");
		const clientId = form.get("client_id");

		if (!refreshToken || !clientId) {
			throw new OAuthError(
				"invalid_request",
				"Missing parameters for refresh_token grant",
				400,
			);
		}

		const grant = this.#refreshGrants.get(refreshToken);
		if (!grant) {
			throw new OAuthError(
				"invalid_grant",
				"Refresh token is invalid or expired",
				400,
			);
		}

		if (Date.now() > grant.issuedAt + this.refreshTokenLifetimeSeconds * 1000) {
			this.#refreshGrants.delete(refreshToken);
			throw new OAuthError(
				"invalid_grant",
				"Refresh token is invalid or expired",
				400,
			);
		}

		if (grant.clientId !== clientId) {
			throw new OAuthError(
				"invalid_grant",
				"Client mismatch for refresh token",
				400,
			);
		}

		if (!this.refreshTokenReuse) {
			this.#refreshGrants.delete(refreshToken);
		}

		const tokenParams: Record<string, string> = {};
		for (const [key, value] of form) {
			tokenParams[key] = value;
		}

		const tokenHeaders: Record<string, string> = {};
		for (const [key, value] of request.headers) {
			tokenHeaders[key] = value;
		}

		return this.buildTokenResponse(
			grant.user,
			grant.scope,
			clientId,
			grant.authContext,
			tokenHeaders,
			tokenParams,
			true,
		);
	}

	private async assertValidPkce(grant: AuthorizationGrant, verifier: string) {
		const expectedChallenge =
			grant.codeChallengeMethod === "S256"
				? await calculatePKCECodeChallenge(verifier)
				: verifier;

		if (expectedChallenge !== grant.codeChallenge) {
			throw new OAuthError(
				"invalid_grant",
				"code_verifier does not match the stored code_challenge",
				400,
			);
		}
	}

	private async buildTokenResponse(
		user: MockUser,
		scope: string,
		clientId: string,
		authContext: AuthorizationRequestContext,
		tokenHeaders: Record<string, string>,
		tokenParams: Record<string, string>,
		isRefresh = false,
	): Promise<TokenEndpointSuccess> {
		const issuedAt = Math.floor(Date.now() / 1000);
		const expiresAt = issuedAt + this.accessTokenLifetimeSeconds;
		const accessPayload: Record<string, unknown> = {
			iss: this.issuer,
			aud: clientId,
			sub: user.sub,
			email: user.email,
			email_verified: user.email_verified,
			name: user.name,
			preferred_username: user.preferred_username,
			scope,
			iat: issuedAt,
			exp: expiresAt,
			jti: crypto.randomUUID(),
		};

		if (this.adjustTokenPayload) {
			const extra = await this.adjustTokenPayload({
				authContext,
				tokenHeaders,
				tokenParams,
			});
			Object.assign(accessPayload, extra);
		}

		const idTokenPayload = {
			...accessPayload,
			nonce: randomBytes(8).toString("hex"),
		};

		const access_token = this.createJwt(accessPayload);
		const id_token = this.createJwt(idTokenPayload);

		let refresh_token: string | undefined;
		if (scope.includes("offline_access")) {
			if (!isRefresh || this.refreshTokenRotation) {
				refresh_token = this.generateRefreshToken(
					user,
					scope,
					clientId,
					authContext,
				);
			}
		}

		const response: TokenEndpointSuccess = {
			access_token,
			token_type: "Bearer",
			expires_in: this.accessTokenLifetimeSeconds,
			id_token,
			scope,
		};

		if (refresh_token) {
			response.refresh_token = refresh_token;
			response.refresh_expires_in = this.refreshTokenLifetimeSeconds;
		}

		return response;
	}

	private generateRefreshToken(
		user: MockUser,
		scope: string,
		clientId: string,
		authContext: AuthorizationRequestContext,
	) {
		const token = `rt_${randomBytes(24).toString("hex")}`;
		this.#refreshGrants.set(token, {
			token,
			user,
			clientId,
			scope,
			authContext,
			issuedAt: Date.now(),
		});
		return token;
	}

	private createJwt(payload: Record<string, unknown>) {
		const header = { alg: "HS256", typ: "JWT", kid: "mock-key" };
		return `${this.base64UrlEncode(header)}.${this.base64UrlEncode(payload)}.mock-signature`;
	}

	private base64UrlEncode(input: Record<string, unknown>) {
		return Buffer.from(JSON.stringify(input)).toString("base64url");
	}

	private resolveUser(loginHint?: string | null): MockUser {
		const email = loginHint || DEFAULT_LOGIN_HINT;
		const username = email.split("@")[0] || "user";
		return {
			sub: this.createUserSub(email),
			email,
			name: username.replace(/\./g, " "),
			preferred_username: username,
			email_verified: true,
			locale: "en",
		};
	}

	private createUserSub(email: string) {
		return `sub_${createHash("sha256").update(email).digest("hex").slice(0, 16)}`;
	}

	private generateCode() {
		return `code_${randomBytes(16).toString("hex")}`;
	}
}
