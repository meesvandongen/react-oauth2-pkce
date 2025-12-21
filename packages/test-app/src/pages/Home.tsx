import { Link } from "react-router";

export function Component() {
	return (
		<div>
			<h1>OAuth2 PKCE Test Application</h1>
			<p>Test pages for different OAuth2 PKCE configurations:</p>
			<nav>
				<ul>
					<li>
						<Link to="/configurable" data-testid="link-configurable">
							Configurable Auth
						</Link>
						<p>Dynamic configuration via URL parameters</p>
					</li>
				</ul>
			</nav>
		</div>
	);
}
