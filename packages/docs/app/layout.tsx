import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Provider } from "@/components/provider";
import { siteConfig } from "@/lib/layout.shared";
import "./global.css";

const inter = Inter({
	subsets: ["latin"],
});

const metadataBase = new URL(
	process.env.NEXT_PUBLIC_DOCS_SITE_URL ?? "http://localhost:3000",
);

export const metadata: Metadata = {
	metadataBase,
	title: {
		default: siteConfig.title,
		template: `%s | ${siteConfig.title}`,
	},
	description: siteConfig.description,
	applicationName: siteConfig.name,
	openGraph: {
		title: siteConfig.title,
		description: siteConfig.description,
		siteName: siteConfig.title,
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: siteConfig.title,
		description: siteConfig.description,
	},
};

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={inter.className} suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">
				<Provider>{children}</Provider>
			</body>
		</html>
	);
}
