# @mvd/auth
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/soofstad/react-oauth2-pkce/blob/main/LICENSE) ![NPM Version](https://img.shields.io/npm/v/@mvd/auth?logo=npm&label=version) ![NPM Downloads](https://img.shields.io/npm/d18m/@mvd/auth?logo=npm) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/@mvd/auth?label=size) ![CI](https://github.com/soofstad/react-oauth2-pkce/actions/workflows/tests.yaml/badge.svg)

Provider-agnostic OAuth2 Authorization Code Flow with PKCE for browser apps, with React hooks available from `@mvd/auth/react`.

Adhering to the RFCs recommendations, cryptographically sound, and with __zero__ dependencies!  

## What is OAuth2 Authorization Code Flow with Proof Key for Code Exchange?

Short version;  
The modern and secure way to do authentication for mobile and web applications!

Long version;  
<https://www.rfc-editor.org/rfc/rfc6749.html>  
<https://datatracker.ietf.org/doc/html/rfc7636>  
<https://oauth.net/2/pkce/>

## Features

- Authorization provider-agnostic. Works equally well with all OAuth2 authentication servers following the OAuth2 spec
- Supports OpenID Connect (idTokens)
- Pre- and Post-login callbacks
- Session expired callback
- Silently refreshes short-lived access tokens in the background
- Decodes JWT's
- A total of ~440 lines of code, easy for anyone to audit and understand

## Example

```tsx
import { createAuth } from "@mvd/auth";
import { useAuth, useAuthRequired } from "@mvd/auth/react";

const auth = createAuth({
    clientId: "myClientID",
    authorizationEndpoint: "https://myAuthProvider.com/auth",
    tokenEndpoint: "https://myAuthProvider.com/token",
    redirectUri: "http://localhost:3000/",
    scope: "openid profile email",
    autoLogin: false,
});

function LoginGate() {
  const snapshot = useAuth(auth);

    if (snapshot.status === "loading") return <p>Logging in...</p>;
    if (snapshot.status === "unauthenticated") {
        return <button onClick={() => auth.login()}>Log in</button>;
    }

    return <AuthenticatedProfile />;
}

function AuthenticatedProfile() {
  const authenticated = useAuthRequired(auth);
    return (
        <>
            <h4>Access Token</h4>
            <pre>{authenticated.token}</pre>
            <h4>User Information from JWT</h4>
            <pre>{JSON.stringify(authenticated.tokenData, null, 2)}</pre>
        </>
    );
}
```

For more advanced examples, see `./examples/`.  

## Install

The package is available on npmjs.com here: https://www.npmjs.com/package/@mvd/auth

```bash
npm install @mvd/auth
```

## API

### AuthSnapshot values (from `useAuth()`)

`useAuth(auth)` returns the full discriminated union. Guard once on `status` when you need to branch on loading/unauthenticated/authenticated.

```typescript
type AuthSnapshot =
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
      tokenData: TokenData;
      // Present only when `oidc: true`
      idToken?: string;
      idTokenData?: TokenData;
      // Present only when `userInfo: true`
      userInfo?: UserInfo;
	  };
```

`tokenData` is always available for authenticated users (access tokens must be JWTs).
Set `oidc: true` to require and expose `idToken`/`idTokenData`.
When `userInfo: true`, `userInfo` is required for authenticated snapshots.

### `useAuthRequired()`

Use `useAuthRequired(auth)` when the component requires an authenticated user. It returns only the authenticated branch and throws if auth is currently `loading` or `unauthenticated`.

This pattern gives better DX in protected routes/components because token fields are guaranteed.

You can also use decoded token and userinfo payloads directly:

```tsx
type AccessClaims = { sub: string; name: string };
type IdClaims = { sub: string; email: string };
type Profile = { sub: string; preferred_username: string };

const auth = createAuth({
  clientId: "myClientID",
  authorizationEndpoint: "https://myAuthProvider.com/auth",
  tokenEndpoint: "https://myAuthProvider.com/token",
  redirectUri: "http://localhost:3000/",
  oidc: true,
  userInfo: true,
  userInfoEndpoint: "https://myAuthProvider.com/userinfo",
});

function StrictProfile() {
  const authenticated = useAuthRequired(auth);
  // tokenData and idTokenData are strongly typed here (oidc: true)
  return <pre>{authenticated.userInfo.preferred_username}</pre>;
}
```

### Type inference cookbook

These patterns require **no explicit TypeScript generic parameters**. The `auth` instance type is inferred from `createAuth(...)` config.

#### 1) Basic auth

```tsx
const auth = createAuth({
  clientId: "myClientID",
  authorizationEndpoint: "https://myAuthProvider.com/auth",
  tokenEndpoint: "https://myAuthProvider.com/token",
  redirectUri: "http://localhost:3000/",
});

const snapshot = useAuth(auth);
if (snapshot.status === "authenticated") {
  // tokenData: TokenData
  console.log(snapshot.tokenData);
}
```

#### 2) OIDC token payloads

```tsx
type AccessClaims = { sub: string; name: string };
type IdClaims = { sub: string; email: string };

const auth = createAuth({
  clientId: "myClientID",
  authorizationEndpoint: "https://myAuthProvider.com/auth",
  tokenEndpoint: "https://myAuthProvider.com/token",
  redirectUri: "http://localhost:3000/",
  oidc: true,
});

const authenticated = useAuthRequired(auth);
// tokenData/idTokenData are decoded payload objects
const accessClaims = authenticated.tokenData as AccessClaims;
const idClaims = authenticated.idTokenData as IdClaims;
accessClaims.name;
idClaims.email;
```

#### 3) OIDC + UserInfo typing

```tsx
type Profile = { sub: string; preferred_username: string };

const auth = createAuth({
  clientId: "myClientID",
  authorizationEndpoint: "https://myAuthProvider.com/auth",
  tokenEndpoint: "https://myAuthProvider.com/token",
  redirectUri: "http://localhost:3000/",
  oidc: true,
  userInfo: true,
  userInfoEndpoint: "https://myAuthProvider.com/userinfo",
});

const authenticated = useAuthRequired(auth);
const profile = authenticated.userInfo as Profile;
profile.preferred_username;
```

### UserInfo typing based on config

When `userInfo: true` is provided in config (and `userInfoEndpoint` is set), authenticated snapshots include:

- `userInfo`

When userinfo fetching is not enabled, those fields are not exposed in authenticated snapshot types.

### Configuration parameters

`@mvd/auth` aims to "just work" with any authentication provider that either
supports the [OAuth2](https://datatracker.ietf.org/doc/html/rfc7636) or [OpenID Connect](https://openid.net/developers/specs/) (OIDC) standards.  
However, many authentication providers are not following these standards, or have extended them. 
With this in mind, if you are experiencing any problems, a good place to start is to see if the provider expects some custom parameters.
If they do, these can be injected into the different calls with these configuration options;

- `extraAuthParameters`
- `extraTokenParameters`
- `extraLogoutParameters`

`createAuth(config)` accepts this configuration type:

```typescript
type AuthConfig = {
  // ID of your app at the authentication provider
  clientId: string  // Required
  // URL for the authentication endpoint at the authentication provider
  authorizationEndpoint: string  // Required
  // URL for the token endpoint at the authentication provider
  tokenEndpoint: string  // Required
  // Which URL the auth provider should redirect the user to after successful authentication/login
  redirectUri: string  // Required
  // Which scopes to request for the auth token
  scope?: string  // default: ''
  // Optional state value. Will often make more sense to provide the state in a call to the 'login()' function
  state?: string // default: null
  // Which URL to call for logging out of the auth provider
  logoutEndpoint?: string  // default: null
  // Which URL the auth provider should redirect the user to after logout
  logoutRedirect?: string  // default: null
  // Which method to use for login. Can be 'redirect', 'replace', or 'popup'
  // Note that most browsers block popups by default. The library will print a warning and fallback to redirect if the popup is blocked
    loginMethod?: 'redirect' | 'replace' | 'popup'  // default: 'redirect'
  // Enable OIDC behavior. When true, id_token is required and exposed in authenticated snapshots.
  oidc?: boolean  // default: false
    // Optional OpenID Connect userinfo endpoint
    userInfoEndpoint?: string // default: undefined
    // Require userinfo as part of authenticated state (requires userInfoEndpoint)
    userInfo?: boolean // default: false
    // Credentials policy used when fetching userinfo
    userInfoRequestCredentials?: 'same-origin' | 'include' | 'omit' // default: 'same-origin'
  // By default, the package will automatically redirect the user to the login server if not already logged in.
  // If set to false, you need to call the "login()" function to log in (e.g. with a "Log in" button)
  autoLogin?: boolean  // default: true
  // Store login state in 'localStorage' or 'sessionStorage'
    // If set to 'session', no login state is persisted by '@mvd/auth' when the browser closes.
  // NOTE: Many authentication servers will keep the client logged in by cookies. You should therefore use 
  // the logout() function to properly log out the client. Or configure your server not to issue cookies.
  storage?: 'local' | 'session'  // default: 'local'
  // Sets the prefix for keys used by this library in storage
  storageKeyPrefix?: string // default: 'ROCP_'
  // Set to false if you need to access the urlParameters sent back from the login server.
  clearURL?: boolean  // default: true
  // Can be used to provide any non-standard parameters to the authentication request
  extraAuthParameters?: { [key: string]: string | boolean | number }  // default: null
  // Can be used to provide any non-standard parameters to the token request
  extraTokenParameters?: { [key: string]: string | boolean | number } // default: null
  // Can be used to provide any non-standard parameters to the logout request
  extraLogoutParameters?: { [key: string]: string | boolean | number } // default: null
  // Can be used if auth provider doesn't return access token expiration time in token response
  tokenExpiresIn?: number // default: null
  // Can be used if auth provider doesn't return refresh token expiration time in token response
  refreshTokenExpiresIn?: number // default: null
  // Defines the expiration strategy for the refresh token.
  // - 'renewable': The refresh token's expiration time is renewed each time it is used, getting a new validity period.
  // - 'absolute': The refresh token's expiration time is fixed from its initial issuance and does not change, regardless of how many times it is used.
  refreshTokenExpiryStrategy?: 'renewable' | 'absolute' // default: renewable
  // Whether or not to post 'scope' when refreshing the access token
  refreshWithScope?: boolean // default: true
  // Controls whether browser credentials (cookies, TLS client certificates, or authentication headers containing a username and password) are sent when requesting tokens.
  // Warning: Including browser credentials deviates from the standard protocol and can introduce unforeseen security issues. Only set this to 'include' if you know what 
  // you are doing and CSRF protection is present. Setting this to 'include' is required when the token endpoint requires client certificate authentication, but likely is
  // not needed in any other case. Use with caution.
  tokenRequestCredentials?: 'same-origin' | 'include' | 'omit' // default: 'same-origin'
}

```

## Common issues

### Sessions expire too quickly

A session expire happens when the `refresh_token` is no longer valid and can't be used to fetch a new valid `access_token`.
This is governed by the `expires_in`, and `refresh_expires_in | refresh_token_expires_in`, in the token response.
If the response does not contain these values, the library assumes a quite conservative value. 
You should configure your IDP (Identity Provider) to send these, but if that is not possible, you can set them explicitly
with the config parameters `tokenExpiresIn` and `refreshTokenExpiresIn`.

### Fails to compile with Next.js
`createAuth()` and hooks from `@mvd/auth/react` are _client-side only_ (they rely on browser APIs like `window`, `crypto`, and storage). They cannot run during server rendering.

This can be solved by marking your auth-using module with `use client` and (optionally) loading it client-only (`"ssr": false`).

```tsx
'use client'
import dynamic from 'next/dynamic'
import { createAuth } from '@mvd/auth'
import { useAuth } from '@mvd/auth/react'

const AuthPage = dynamic(
    () => import('./AuthPage'),
    {ssr: false}
)

const auth = createAuth({
    clientId: 'my-client-id',
    authorizationEndpoint: 'https://idp.example.com/auth',
    tokenEndpoint: 'https://idp.example.com/token',
    redirectUri: 'http://localhost:3000/',
})

export default function Authenticated() {
    const snapshot = useAuth(auth)
    return <AuthPage status={snapshot.status} />
}
```

### Error `Bad authorization state...`

This is most likely to happen if the authentication at the identity provider got aborted in some way.
You might also see the error `Expected  to find a '?code=' parameter in the URL by now. Did the authentication get aborted or interrupted?` in the console.

First of all, you should handle any errors the library throws. Usually, hinting at the user reload the page is enough.

Some known causes for this is that instead of logging in at the auth provider, the user "Registers" or "Reset password" or 
something similar instead. Any such functions should be handled outside of this library, with separate buttons/links than the "Log in" button.

### After redirect back from auth provider with `?code`, no token request is made

If you are using libraries that intercept any `fetch()`-requests made. For example `@tanstack/react-query`. That can cause
issues for auth token fetching. This can be solved by avoiding wrappers that override or block fetch behavior around your auth bootstrap path.

This could also happen if auth initialization (`createAuth(...)`) is not executed on routes that should process the redirect callback.

### The page randomly refreshes in the middle of a session

This will happen when refresh token rotation/expiry reaches a point where silent refresh can no longer continue.
Subscribe to the `refresh-token-expired` event and prompt users to log in again.
You probably want to implement some kind of "alert/message/banner", saying that the session has expired and that the user needs to log in again.
Either by refreshing the page, or clicking a "Log in" button.

## Develop

1. Update auth config in the test app (`packages/test-app/src/pages/ConfigurableAuth.tsx`) to match your provider.
2. Install dependencies -> `$ pnpm install`
3. Run the test app -> `$ pnpm --filter e2e-test-app start`

## Contribute

You are most welcome to create issues and pull requests :)

## TODO

- Multiple Tab support
- onSessionExpired callback