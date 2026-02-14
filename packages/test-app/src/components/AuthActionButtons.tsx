import { Auth } from "@mvd/auth";

interface AuthActionButtonsProps {
	store: Auth;
}

export function AuthActionButtons({ store }: AuthActionButtonsProps) {
	return (
		<div>
			<button onClick={() => store.login()} data-testid="login-button">
				Log In
			</button>
			<button
				onClick={() =>
					store.login({
						method: "replace",
					})
				}
				data-testid="login-replace-button"
			>
				Log In (replace)
			</button>
			<button
				onClick={() => store.login({ method: "popup" })}
				data-testid="login-popup-button"
			>
				Log In (popup)
			</button>
			<button
				onClick={() => store.login({ method: "redirect" })}
				data-testid="login-redirect-button"
			>
				Log In (redirect)
			</button>
			<button
				onClick={() =>
					store.login({
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
				onClick={() => store.login({ state: "login-custom-state-button" })}
				data-testid="login-custom-state-button"
			>
				Log In (custom state)
			</button>

			<button onClick={() => store.logout()} data-testid="logout-button">
				Log Out
			</button>

			<button
				onClick={() => store.logout({ state: "logout-with-state-button" })}
				data-testid="logout-with-state-button"
			>
				Log Out (With State)
			</button>
			<button
				onClick={() => store.logout({ logoutHint: "user@example.com" })}
				data-testid="logout-with-hint-button"
			>
				Log Out (With Hint)
			</button>
			<button
				onClick={() =>
					store.logout({
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
