import { FetchError } from "./errors";
import type { TokenRequest } from "./types";

function buildUrlEncodedRequest(request: TokenRequest): string {
	let queryString = "";
	for (const [key, value] of Object.entries(request)) {
		queryString += `${queryString ? "&" : ""}${key}=${encodeURIComponent(value)}`;
	}
	return queryString;
}

interface PostWithXFormParams {
	url: string;
	request: TokenRequest;
	credentials: RequestCredentials;
}

export async function postWithXForm({
	url,
	request,
	credentials,
}: PostWithXFormParams): Promise<Response> {
	return fetch(url, {
		method: "POST",
		body: buildUrlEncodedRequest(request),
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		credentials: credentials,
	}).then(async (response: Response) => {
		if (!response.ok) {
			const responseBody = await response.text();
			throw new FetchError(response.status, response.statusText, responseBody);
		}
		return response;
	});
}
