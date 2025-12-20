import { AuthCoreStore } from "@mvd/auth-core";
import { useAuth } from "@mvd/auth-react";

interface AuthActionButtonsProps {
	store: AuthCoreStore;
}

export function AuthActionButtons({ store }: AuthActionButtonsProps) {
	const { logIn, logOut } = useAuth(store);

	return (
		<div>
			<button onClick={() => logIn()} data-testid="login-button">
				Log In
			</button>
			<button
				onClick={() =>
					logIn({
						method: "replace",
					})
				}
				data-testid="login-replace-button"
			>
				Log In (replace)
			</button>
			<button
				onClick={() => logIn({ method: "popup" })}
				data-testid="login-popup-button"
			>
				Log In (popup)
			</button>
			<button
				onClick={() => logIn({ method: "redirect" })}
				data-testid="login-redirect-button"
			>
				Log In (redirect)
			</button>
			<button
				onClick={() =>
					logIn({
						additionalParameters: {
							custom_button_param: "extra-param-from-button",
						},
					})
				}
				data-testid="login-extra-param-button"
			>
				Log In (extra parameter)
			</button>
			<button
				onClick={() => logIn({ state: "login-custom-state-button" })}
				data-testid="login-custom-state-button"
			>
				Log In (custom state)
			</button>

			<button onClick={() => logOut()} data-testid="logout-button">
				Log Out
			</button>

			<button
				onClick={() => logOut({ state: "logout-with-state-button" })}
				data-testid="logout-with-state-button"
			>
				Log Out (With State)
			</button>
			<button
				onClick={() => logOut({ logoutHint: "user@example.com" })}
				data-testid="logout-with-hint-button"
			>
				Log Out (With Hint)
			</button>
			<button
				onClick={() =>
					logOut({
						state: "state-123",
						logoutHint: "user@example.com",
						additionalParameters: { extra_param: "value" },
					})
				}
				data-testid="logout-full-button"
			>
				Log Out (Full Params)
			</button>
		</div>
	);
}
