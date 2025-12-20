import { AuthProvider, type TAuthConfig } from "@mvd/auth-react";
import type { PropsWithChildren, ReactNode } from "react";

interface AuthPageProps extends PropsWithChildren {
	title: string;
	authConfig: TAuthConfig;
	description?: ReactNode;
}

export function AuthPage({
	title,
	description,
	children,
	authConfig,
}: AuthPageProps) {
	return (
		<AuthProvider authConfig={authConfig}>
			<section className="auth-test-page">
				<header style={{ marginBottom: "20px" }}>
					<h2>{title}</h2>
					{description && (
						<div className="auth-test-page__description">{description}</div>
					)}
				</header>

				{children}
			</section>
		</AuthProvider>
	);
}
