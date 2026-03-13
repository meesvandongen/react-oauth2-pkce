import { NetworkFixture } from "@mvd/playwright-msw";
import { test as base, Page } from "@playwright/test";
import { createOAuthHandlers } from "./msw/handlers";
import { MockOAuthProvider } from "./msw/mockOAuthProvider";

type Fixtures = {
	oauth: MockOAuthProvider;
	network: NetworkFixture;
};

export const test = base.extend<Fixtures>({
	oauth: async ({}, use) => {
		const provider = new MockOAuthProvider();
		await use(provider);
	},
	network: [
		async ({ oauth, page, context, baseURL }, use) => {
			const handlers = createOAuthHandlers(oauth);
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
