import { NetworkFixture } from "@mvd/playwright-msw";
import { test as base, Page } from "@playwright/test";
import { createOidcHandlers } from "./msw/handlers";
import { MockOidcProvider } from "./msw/mockOidcProvider";

type Fixtures = {
	oidc: MockOidcProvider;
	network: NetworkFixture;
};

export const test = base.extend<Fixtures>({
	oidc: async ({}, use) => {
		const provider = new MockOidcProvider();
		await use(provider);
	},
	network: [
		async ({ oidc, page, context, baseURL }, use) => {
			const handlers = createOidcHandlers(oidc);
			const networkFixture = new NetworkFixture({
				initialHandlers: handlers,
				context,
				baseUrl: baseURL,
			});

			await networkFixture.start();
			await use(networkFixture);
			await networkFixture.stop();
		},
		{ auto: true },
	],
});

export const expect = test.expect;
