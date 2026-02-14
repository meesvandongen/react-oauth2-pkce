import { decodeJWT } from "./decodeJWT";
import { FetchError } from "./errors";
import type { TokenData } from "./types";

function looksLikeJwt(token: string): boolean {
	return token.split(".").length === 3;
}

export async function fetchUserInfo(props: {
	userInfoEndpoint: string;
	accessToken: string;
	credentials: RequestCredentials;
}): Promise<TokenData> {
	const { userInfoEndpoint, accessToken, credentials } = props;
	const response = await fetch(userInfoEndpoint, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/json",
		},
		credentials,
	});

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new FetchError(response.status, response.statusText, body);
	}

	// OIDC userinfo is usually JSON, but some providers return a JWT (application/jwt).
	// Be liberal in what we accept.
	const text = await response.text();
	try {
		return JSON.parse(text) as TokenData;
	} catch (_err) {
		if (looksLikeJwt(text)) {
			return decodeJWT(text);
		}
		return { raw: text };
	}
}
