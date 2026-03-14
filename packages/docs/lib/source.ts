import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";
import type { Source } from "fumadocs-core/source";

// fumadocs-mdx v11 lazily wraps `files` in a function; unwrap it for fumadocs-core v15.
function resolveSource(raw: Source): Source {
	const { files } = raw as { files: unknown };
	if (typeof files === "function") {
		return { ...raw, files: (files as () => unknown[])() as Source["files"] };
	}
	return raw;
}

export const source = loader({
	baseUrl: "/docs",
	source: resolveSource(docs.toFumadocsSource()),
});
