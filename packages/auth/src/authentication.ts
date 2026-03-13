import { postWithXForm } from "./httpUtils";
import type {
	InternalConfig,
	TokenRequest,
	TokenRequestForRefresh,
	TokenRequestWithCodeAndVerifier,
	TokenResponse,
} from "./types";

export const codeVerifierStorageKey = "PKCE_code_verifier";
export const urlHashStorageKey = "url_hash";

// This is called a "type predicate". Which allow us to know which kind of response we got, in a type safe way.
function isTokenResponse(body: unknown | TokenResponse): body is TokenResponse {
	return (body as TokenResponse).access_token !== undefined;
}

async function postTokenRequest(
	tokenEndpoint: string,
	tokenRequest: TokenRequest,
	credentials: RequestCredentials,
): Promise<TokenResponse> {
	const response = await postWithXForm({
		url: tokenEndpoint,
		request: tokenRequest,
		credentials: credentials,
	});
	const body = await response.json();
	if (isTokenResponse(body)) {
		return body;
	}
	throw Error(JSON.stringify(body));
}

export const fetchTokens = (config: InternalConfig): Promise<TokenResponse> => {
	const storage = config.storage === "session" ? sessionStorage : localStorage;
	/*
    The browser has been redirected from the authentication endpoint with
    a 'code' url parameter.
    This code will now be exchanged for Access- and Refresh Tokens.
  */
	const urlParams = new URLSearchParams(window.location.search);
	const authCode = urlParams.get("code");
	// Prefix the code verifier key name to prevent multi-application collisions
	const codeVerifierStorageKeyName =
		config.storageKeyPrefix + codeVerifierStorageKey;
	const codeVerifier = storage.getItem(codeVerifierStorageKeyName);

	if (!authCode) {
		throw Error(
			"Parameter 'code' not found in URL. \nHas authentication taken place?",
		);
	}
	if (!codeVerifier) {
		throw Error(
			"Can't get tokens without the CodeVerifier. \nHas authentication taken place?",
		);
	}

	const tokenRequest: TokenRequestWithCodeAndVerifier = {
		grant_type: "authorization_code",
		code: authCode,
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		code_verifier: codeVerifier,
		...config.extraTokenParameters,
	};
	return postTokenRequest(
		config.tokenEndpoint,
		tokenRequest,
		config.tokenRequestCredentials,
	);
};

export const fetchWithRefreshToken = (props: {
	config: InternalConfig;
	refreshToken: string;
}): Promise<TokenResponse> => {
	const { config, refreshToken } = props;
	const refreshRequest: TokenRequestForRefresh = {
		grant_type: "refresh_token",
		refresh_token: refreshToken,
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		...config.extraTokenParameters,
	};
	if (config.refreshWithScope) {
		refreshRequest.scope = config.scope;
	}
	return postTokenRequest(
		config.tokenEndpoint,
		refreshRequest,
		config.tokenRequestCredentials,
	);
};

export function redirectToLogout(
	config: InternalConfig,
	_token: string,
	_refreshToken?: string,
) {
	if (!config.logoutEndpoint) {
		return;
	}
	window.location.assign(config.logoutEndpoint);
}
