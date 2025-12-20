import type { PropsWithChildren, ReactNode } from "react";

interface AuthPageProps extends PropsWithChildren {
	title: string;
	description?: ReactNode;
}

export function AuthPage({ title, description, children }: AuthPageProps) {
	return (
		<section className="auth-test-page">
			<header style={{ marginBottom: "20px" }}>
				<h2>{title}</h2>
				{description && (
					<div className="auth-test-page__description">{description}</div>
				)}
			</header>

			{children}
		</section>
	);
}
