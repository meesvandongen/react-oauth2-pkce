# @mvd/auth

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/soofstad/react-oauth2-pkce/blob/main/LICENSE) ![NPM Version](https://img.shields.io/npm/v/@mvd/auth?logo=npm&label=version) ![NPM Downloads](https://img.shields.io/npm/d18m/@mvd/auth?logo=npm) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/@mvd/auth?label=size) ![CI](https://github.com/soofstad/react-oauth2-pkce/actions/workflows/tests.yaml/badge.svg)

Provider-agnostic OAuth 2.0 Authorization Code Flow with PKCE for browser apps, with React hooks available from `@mvd/auth/react`.

## What this package does

- Starts the OAuth authorization code flow with PKCE
- Exchanges the authorization code for tokens
- Persists auth state in `localStorage` or `sessionStorage`
- Refreshes access tokens in the background when a refresh token is available
- Exposes small React hooks for auth state
- Decodes JWT access tokens into `tokenData`

## Scope of the library

This package is intentionally focused on **OAuth PKCE only**.

It does **not** include OpenID Connect features such as:

- `id_token`
- UserInfo endpoint fetching
- OIDC discovery metadata handling

If your provider issues JWT access tokens, the decoded payload is available as `tokenData`.
If your provider issues opaque access tokens, this package is not a fit in its current form.

Logout is intentionally minimal: `logout()` clears local auth state and, if `logoutEndpoint` is configured, navigates the browser to that URL.
What happens at that endpoint is provider-specific and is **not** standardized by OAuth 2.0.

## Install

```bash
npm install @mvd/auth
```

## Quick example

```tsx
import { createAuth } from "@mvd/auth";
import { useAuth, useAuthRequired } from "@mvd/auth/react";

const auth = createAuth({
	clientId: "my-client-id",
	authorizationEndpoint: "https://auth.example.com/authorize",
	tokenEndpoint: "https://auth.example.com/token",
	redirectUri: window.location.origin,
	scope: "api:read offline_access",
	autoLogin: false,
});

function LoginGate() {
	const snapshot = useAuth(auth);

	if (snapshot.status === "loading") return <p>Logging in…</p>;
	if (snapshot.status === "unauthenticated") {
		return <button onClick={() => auth.login()}>Log in</button>;
	}

	return <AuthenticatedPanel />;
}

function AuthenticatedPanel() {
	const authenticated = useAuthRequired(auth);

	return (
		<>
			<h4>Access token</h4>
			<pre>{authenticated.token}</pre>

			<h4>Decoded JWT payload</h4>
			<pre>{JSON.stringify(authenticated.tokenData, null, 2)}</pre>
		</>
	);
}
```

## API

### `useAuth(auth)`

Returns the full discriminated union:

```ts
type AuthSnapshot<AccessTokenData = TokenData> =
	| {
			status: "loading";
			error: string | null;
	  }
	| {
			status: "unauthenticated";
			error: string | null;
	  }
	| {
			status: "authenticated";
			error: string | null;
			token: string;
			tokenData: AccessTokenData;
	  };
```

### `useAuthRequired(auth)`

Returns only the authenticated branch and throws unless the user is currently authenticated.

### Typed access-token payloads

You can type the decoded access-token payload through the `auth` instance:

```tsx
type AccessClaims = {
	sub: string;
	name: string;
	scope: string;
};

const auth = createAuth<AccessClaims>({
	clientId: "my-client-id",
	authorizationEndpoint: "https://auth.example.com/authorize",
	tokenEndpoint: "https://auth.example.com/token",
	redirectUri: window.location.origin,
});

const authenticated = useAuthRequired(auth);
authenticated.tokenData.name;
```

### Configuration

`createAuth(config)` accepts:

```ts
type AuthConfig = {
	clientId: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	redirectUri: string;
	scope?: string;
	// Optional app-defined round-trip value forwarded to the authorization request and callback.
	state?: string;
	logoutEndpoint?: string;
	loginMethod?: "redirect" | "replace" | "popup";
	autoLogin?: boolean;
	clearURL?: boolean;
	extraAuthParameters?: Record<string, string | boolean | number>;
	extraTokenParameters?: Record<string, string | boolean | number>;
	tokenExpiresIn?: number;
	refreshTokenExpiresIn?: number;
	refreshTokenExpiryStrategy?: "renewable" | "absolute";
	storage?: "local" | "session";
	storageKeyPrefix?: string;
	refreshWithScope?: boolean;
	tokenRequestCredentials?: "same-origin" | "include" | "omit";
};
```

`state` is optional and treated as an application convenience for round-tripping UI context through the provider redirect.
This library does not use `state` as its primary security mechanism; PKCE is the protection relied on for the authorization code flow.

### Logout behavior

`auth.logout()` always clears the locally stored auth state.
If `logoutEndpoint` is set, the browser is then navigated to that endpoint.

The library does not define a logout request protocol, logout redirect parameters, or custom logout payload parameters because those are outside the OAuth 2.0 standard.

## Common issues

### Sessions expire too quickly

This happens when the refresh token can no longer be used to obtain a new access token.
If your provider omits `expires_in`, `refresh_expires_in`, or `refresh_token_expires_in`, you can override them with:

- `tokenExpiresIn`
- `refreshTokenExpiresIn`

### Next.js / SSR builds fail

`createAuth()` and the hooks are client-side only because they depend on browser APIs like `window`, `crypto`, and Web Storage.

Mark auth-consuming modules with `"use client"` and, if needed, load them client-only.

### Login redirect gets stuck or comes back without a token

This usually means the redirect callback was interrupted or the provider returned without a usable `code` parameter.

### No token request happens after redirect

Common causes:

- app bootstrapping does not run on the callback route
- another library interferes with `fetch()` during auth initialization

## Develop

1. Update the test app config in `packages/test-app/src/pages/ConfigurableAuth.tsx`.
2. Install dependencies with `pnpm install`.
3. Run the demo app with `pnpm --filter test-app start`.

## Contribute

Issues and pull requests are welcome.