import nodeCrypto from "node:crypto";

// Ensure WebCrypto is available consistently in tests.
// happy-dom may provide a partial crypto; oauth4webapi expects full WebCrypto + getRandomValues.
Object.defineProperty(globalThis, "crypto", {
	value: nodeCrypto.webcrypto,
	writable: true,
	configurable: true,
});

if (typeof window !== "undefined") {
	try {
		Object.defineProperty(window, "crypto", {
			value: nodeCrypto.webcrypto,
			writable: true,
			configurable: true,
		});
	} catch {
		// ignore
	}
}

// Some tests (or future ones) may rely on stable URL APIs.
// @ts-ignore
if (typeof window !== "undefined" && window.location) {
	try {
		// happy-dom location is usually fine; keep as-is.
	} catch {
		// ignore
	}
}
