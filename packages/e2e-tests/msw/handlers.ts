import { HttpResponse, http } from "msw";
import { type MockOAuthProvider, OAuthError } from "./mockOAuthProvider";

async function parseFormBody(request: Request) {
	const text = await request.text();
	return new URLSearchParams(text);
}

type HttpResolver = Parameters<typeof http.get>[1];

function withOAuthErrorHandling(resolver: HttpResolver): HttpResolver {
	return async (...args: Parameters<HttpResolver>) => {
		try {
			return await resolver(...args);
		} catch (error) {
			return createOAuthErrorResponse(error);
		}
	};
}

function createOAuthErrorResponse(error: unknown) {
	if (error instanceof OAuthError) {
		return HttpResponse.json(error.toJSON(), { status: error.status });
	}

	const message =
		error instanceof Error ? error.message : "An unexpected error occurred";

	return HttpResponse.json(
		{
			error: "server_error",
			error_description: message,
		},
		{ status: 500 },
	);
}

export function createOAuthHandlers(provider: MockOAuthProvider) {
	return [
		http.get(
			`**/auth`,
			withOAuthErrorHandling(async ({ request }) => {
				const redirectUrl = provider.authorize(request);
				return HttpResponse.redirect(redirectUrl, 302);
			}),
		),

		http.post(
			`**/token`,
			withOAuthErrorHandling(async ({ request }) => {
				const tokens = await provider.issueTokens(request);
				return HttpResponse.json(tokens);
			}),
		),

		http.get(
			`**/logout`,
			withOAuthErrorHandling(async ({ request }) => {
				const { redirect, hasRedirect } =
					provider.createLogoutRedirect(request);
				if (hasRedirect) {
					return HttpResponse.redirect(redirect, 302);
				}
				return HttpResponse.text("Logged out", { status: 200 });
			}),
		),
	];
}
