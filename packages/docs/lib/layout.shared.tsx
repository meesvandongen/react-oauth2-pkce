import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const siteConfig = {
	name: "@mvd/auth",
	title: "@mvd/auth docs",
	description:
		"Browser-first OAuth 2.0 Authorization Code Flow with PKCE, plus optional React hooks.",
	repositoryUrl: "https://github.com/soofstad/react-oauth2-pkce",
	docsContentPath: "packages/docs/content/docs",
};

export const gitConfig = {
	user: "soofstad",
	repo: "react-oauth2-pkce",
	branch: "main",
};

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: siteConfig.name,
		},
		githubUrl: siteConfig.repositoryUrl,
	};
}
