import nodeCrypto from "node:crypto";
import { TextDecoder, TextEncoder } from "node:util";
import { beforeEach, vi } from "vitest";

beforeEach(() => {
	localStorage.removeItem("ROCP_loginInProgress");
	localStorage.removeItem("ROCP_token");
	localStorage.removeItem("ROCP_refreshToken");
	localStorage.removeItem("ROCP_PKCE_code_verifier");

	global.TextEncoder = TextEncoder;
	global.TextDecoder = TextDecoder;

	// @ts-ignore
	Object.defineProperty(global.crypto, "subtle", {
		value: nodeCrypto.webcrypto.subtle,
		writable: true,
		configurable: true,
	});

	// @ts-ignore
	delete window.location;
	const location = new URL("https://www.example.com");
	// @ts-ignore
	location.assign = vi.fn();
	// @ts-ignore
	window.location = location;
	window.open = vi.fn();
});
