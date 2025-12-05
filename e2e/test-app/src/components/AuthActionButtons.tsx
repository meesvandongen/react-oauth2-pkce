import type { CSSProperties } from "react";
import { useContext } from "react";
import { AuthContext, type IAuthContext } from "react-oauth2-code-pkce";

interface AuthActionButtonsProps {
	className?: string;
	style?: CSSProperties;
}

const defaultContainerStyle: CSSProperties = {
	marginTop: "20px",
	display: "flex",
	gap: "8px",
	flexWrap: "wrap",
};

export function AuthActionButtons({
	className,
	style,
}: AuthActionButtonsProps) {
	const { logIn, logOut }: IAuthContext = useContext(AuthContext);

	return (
		<div className={className} style={{ ...defaultContainerStyle, ...style }}>
			<button onClick={() => logIn()} data-testid="login-button">
				Log In
			</button>
			<button
				onClick={() => logIn(undefined, undefined, "replace")}
				data-testid="login-replace-button"
			>
				Log In (replace)
			</button>
			<button
				onClick={() => logIn(undefined, undefined, "popup")}
				data-testid="login-popup-button"
			>
				Log In (popup)
			</button>
			<button
				onClick={() => logIn(undefined, undefined, "redirect")}
				data-testid="login-redirect-button"
			>
				Log In (redirect)
			</button>
			<button
				onClick={() =>
					logIn(undefined, { custom_button_param: "extra-param-from-button" })
				}
				data-testid="login-extra-param-button"
			>
				Log In (extra parameter)
			</button>
			<button onClick={() => logOut()} data-testid="logout-button">
				Log Out
			</button>
		</div>
	);
}
