import type { TokenData } from "./types";

function looksLikeJwt(token: string): boolean {
	// JWTs are three base64url encoded segments separated by '.'
	// If it's not shaped like a JWT, treat it as an opaque token and skip decoding.
	return token.split(".").length === 3;
}

/**
 * Decodes the base64 encoded JWT. Returns a TToken.
 */
export const decodeJWT = (token: string): TokenData => {
	try {
		if (!looksLikeJwt(token)) {
			throw Error("Token is not a JWT (expected three dot-separated segments)");
		}
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
				.join(""),
		);
		return JSON.parse(jsonPayload);
	} catch (e) {
		console.error(e);
		throw Error("Failed to decode token.\n\tA JWT is required.");
	}
};

export const decodeAccessToken = (token: string): TokenData => {
	return decodeJWT(token);
};

export const decodeIdToken = (idToken: string): TokenData => {
	return decodeJWT(idToken);
};
