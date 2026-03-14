import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { TOCItemType } from "fumadocs-core/server";
import type { ComponentType } from "react";
import { source } from "@/lib/source";

interface MDXPageData {
	body: ComponentType;
	toc: TOCItemType[];
	full?: boolean;
	title: string;
	description?: string;
}

export default async function Page(props: {
	params: Promise<{ slug?: string[] }>;
}) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	const data = page.data as unknown as MDXPageData;
	const MDX = data.body;

	return (
		<DocsPage toc={data.toc} full={data.full}>
			<DocsTitle>{data.title}</DocsTitle>
			<DocsDescription>{data.description}</DocsDescription>
			<DocsBody>
				<MDX />
			</DocsBody>
		</DocsPage>
	);
}

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(props: {
	params: Promise<{ slug?: string[] }>;
}) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	const data = page.data as unknown as MDXPageData;

	return {
		title: data.title,
		description: data.description,
	};
}
