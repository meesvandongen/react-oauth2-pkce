import { postWithXForm } from "./httpUtils";
import type {
	InternalConfig,
	PrimitiveRecord,
	TokenRequest,
	TokenRequestForRefresh,
	TokenRequestWithCodeAndVerifier,
	TokenResponse,
} from "./types";

export const codeVerifierStorageKey = "PKCE_code_verifier";
export const stateStorageKey = "ROCP_auth_state";
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
	token: string,
	refresh_token?: string,
	idToken?: string,
	state?: string,
	logoutHint?: string,
	additionalParameters?: PrimitiveRecord,
) {
	const params = new URLSearchParams({
		token: refresh_token || token,
		token_type_hint: refresh_token ? "refresh_token" : "access_token",
		client_id: config.clientId,
		post_logout_redirect_uri: config.logoutRedirect ?? config.redirectUri,
		ui_locales: window.navigator.languages.join(" "),
		...config.extraLogoutParameters,
		...additionalParameters,
	});
	if (idToken) {
		params.append("id_token_hint", idToken);
	}
	if (state) {
		params.append("state", state);
	}
	if (logoutHint) {
		params.append("logout_hint", logoutHint);
	}
	window.location.assign(`${config.logoutEndpoint}?${params.toString()}`);
}

export function validateState(
	urlParams: URLSearchParams,
	storageType: InternalConfig["storage"],
) {
	const storage = storageType === "session" ? sessionStorage : localStorage;
	const receivedState = urlParams.get("state");
	const loadedState = storage.getItem(stateStorageKey);

	// Normalize empty/null states for comparison
	// OAuth servers may return state="" when no state was sent, while storage returns null
	const normalizedReceivedState = receivedState || null;
	const normalizedLoadedState = loadedState || null;

	if (normalizedReceivedState !== normalizedLoadedState) {
		throw new Error(
			'"state" value received from authentication server does no match client request. Possible cross-site request forgery',
		);
	}
}
