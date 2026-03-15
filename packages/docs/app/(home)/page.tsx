import { BookOpen, Cog, Rocket, ShieldCheck } from "lucide-react";
import Link from "next/link";

const quickLinks = [
	{
		href: "/docs/installation",
		title: "Install",
		description:
			"Add the package and understand the browser-only runtime expectations.",
		icon: Rocket,
	},
	{
		href: "/docs/quick-start",
		title: "Quick start",
		description:
			"Create a shared auth instance and wire up the React hooks in minutes.",
		icon: BookOpen,
	},
	{
		href: "/docs/configuration",
		title: "Configuration",
		description:
			"Review every createAuth option and the OAuth behaviour each one controls.",
		icon: Cog,
	},
	{
		href: "/docs/guides/popup-login",
		title: "Popup login",
		description:
			"Use a popup-based OAuth flow when you want to avoid a full-page redirect.",
		icon: ShieldCheck,
	},
];

export default function HomePage() {
	return (
		<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16 sm:px-8 lg:px-10">
			<section className="flex flex-col gap-6 rounded-3xl border bg-fd-card p-8 shadow-sm sm:p-10 lg:p-12">
				<div className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm text-fd-muted-foreground">
					Browser-first OAuth 2.0 PKCE for modern apps
				</div>

				<div className="max-w-3xl space-y-4">
					<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
						Docs for a small OAuth PKCE library that stays out of your way.
					</h1>
					<p className="text-lg text-fd-muted-foreground sm:text-xl">
						<code>@mvd/auth</code> gives you a focused client-side OAuth 2.0
						Authorization Code Flow with PKCE, optional React hooks, and none of
						the OIDC kitchen sink you did not ask for.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<Link
						href="/docs"
						className="inline-flex items-center justify-center rounded-full bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition hover:opacity-90"
					>
						Browse docs
					</Link>
					<Link
						href="/docs/quick-start"
						className="inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium transition hover:bg-fd-accent"
					>
						Start in 5 minutes
					</Link>
					<Link
						href="https://github.com/soofstad/react-oauth2-pkce"
						className="inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium transition hover:bg-fd-accent"
					>
						View repository
					</Link>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{quickLinks.map(({ href, title, description, icon: Icon }) => (
					<Link
						key={href}
						href={href}
						className="group rounded-2xl border bg-fd-card p-5 transition hover:-translate-y-0.5 hover:border-fd-primary/40 hover:shadow-sm"
					>
						<div className="mb-4 inline-flex rounded-xl border p-2 text-fd-muted-foreground transition group-hover:text-fd-primary">
							<Icon className="size-5" />
						</div>
						<h2 className="text-lg font-semibold">{title}</h2>
						<p className="mt-2 text-sm leading-6 text-fd-muted-foreground">
							{description}
						</p>
					</Link>
				))}
			</section>

			<section className="grid gap-6 rounded-3xl border bg-fd-card p-8 md:grid-cols-3 sm:p-10">
				<div>
					<h2 className="text-lg font-semibold">What you will find here</h2>
				</div>
				<div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
					<div className="rounded-2xl border p-4">
						<h3 className="font-medium">Core concepts</h3>
						<p className="mt-2 text-sm text-fd-muted-foreground">
							Installation, quick start, configuration, and troubleshooting for
							the base OAuth flow.
						</p>
					</div>
					<div className="rounded-2xl border p-4">
						<h3 className="font-medium">API reference</h3>
						<p className="mt-2 text-sm text-fd-muted-foreground">
							Focused reference pages for <code>createAuth</code>,{" "}
							<code>useAuth</code>, and <code>useAuthRequired</code>.
						</p>
					</div>
					<div className="rounded-2xl border p-4">
						<h3 className="font-medium">Framework guides</h3>
						<p className="mt-2 text-sm text-fd-muted-foreground">
							Practical guidance for popup login flows, typed tokens, and
							multi-provider setups.
						</p>
					</div>
					<div className="rounded-2xl border p-4">
						<h3 className="font-medium">Project scope</h3>
						<p className="mt-2 text-sm text-fd-muted-foreground">
							Clear boundaries around OAuth PKCE-only behaviour, with OpenID
							Connect extras intentionally left out.
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
