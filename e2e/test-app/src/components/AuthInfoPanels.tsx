import { type ReactNode, useContext } from "react";
import { AuthContext, type IAuthContext } from "../../../../src/index";

interface AuthStatusPanelProps {
	children?: ReactNode;
}

export function AuthStatusPanel({ children }: AuthStatusPanelProps) {
	const { token, error, loginInProgress }: IAuthContext =
		useContext(AuthContext);

	return (
		<div data-testid="auth-status">
			{loginInProgress && (
				<span data-testid="login-in-progress">Login in progress...</span>
			)}
			{error && (
				<div className="error" data-testid="auth-error">
					{error}
				</div>
			)}
			{token && <span data-testid="authenticated">Authenticated</span>}
			{!token && !loginInProgress && (
				<span data-testid="not-authenticated">Not authenticated</span>
			)}
			{children}
		</div>
	);
}

export function AuthTokenDetails() {
	const { token, tokenData, idToken, idTokenData }: IAuthContext =
		useContext(AuthContext);

	return (
		<div style={{ marginTop: "20px" }}>
			<h3>Access Token</h3>
			<pre data-testid="access-token">{token}</pre>

			<h3>Decoded Token Data</h3>
			<pre data-testid="token-data">{JSON.stringify(tokenData, null, 2)}</pre>

			<h3>ID Token</h3>
			<pre data-testid="id-token">{idToken}</pre>

			<h3>Decoded ID Token Data</h3>
			<pre data-testid="id-token-data">
				{JSON.stringify(idTokenData, null, 2)}
			</pre>
		</div>
	);
}
