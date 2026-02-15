import { render, screen } from "@testing-library/react";
import { createAuth } from "../../src";
import { useAuthRequired } from "../../src/react";

const jwt =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.Sfl";

describe("useAuthRequired (authenticated hook)", () => {
	test("throws when persisted access token is opaque", () => {
		localStorage.setItem("ROCP_token", JSON.stringify("opaque-access-token"));
		localStorage.setItem("ROCP_tokenExpire", JSON.stringify(9999999999));

		expect(() =>
			createAuth({
				autoLogin: false,
				clientId: "myClientID",
				authorizationEndpoint: "myAuthEndpoint",
				tokenEndpoint: "myTokenEndpoint",
				redirectUri: "http://localhost/",
			}),
		).toThrow();
	});

	test("returns typed, non-null claims when oidc is enabled", () => {
		localStorage.setItem("ROCP_token", JSON.stringify(jwt));
		localStorage.setItem("ROCP_tokenExpire", JSON.stringify(9999999999));
		localStorage.setItem("ROCP_idToken", JSON.stringify(jwt));

		const auth = createAuth({
			autoLogin: false,
			oidc: true,
			clientId: "myClientID",
			authorizationEndpoint: "myAuthEndpoint",
			tokenEndpoint: "myTokenEndpoint",
			redirectUri: "http://localhost/",
		});

		const StrictConsumer = () => {
			const authenticated = useAuthRequired(auth);
			return (
				<>
					<div data-testid="name">{authenticated.tokenData.name}</div>
					<div data-testid="sub">{authenticated.idTokenData!.sub}</div>
				</>
			);
		};

		render(<StrictConsumer />);
		expect(screen.getByTestId("name").textContent).toBe("John Doe");
		expect(screen.getByTestId("sub").textContent).toBe("1234567890");
	});
});
