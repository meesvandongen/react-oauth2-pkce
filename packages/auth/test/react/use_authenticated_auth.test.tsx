import { render, screen } from "@testing-library/react";
import { createAuth } from "../../src";
import { useAuthenticatedAuth } from "../../src/react";

type Claims = {
	name: string;
	sub: string;
};

const jwt =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.Sfl";

describe("useAuthenticatedAuth", () => {
	test("throws in requireData mode when tokenData is null", () => {
		localStorage.setItem("ROCP_token", JSON.stringify("opaque-access-token"));
		localStorage.setItem("ROCP_tokenExpire", JSON.stringify(9999999999));
		localStorage.setItem("ROCP_idToken", JSON.stringify(jwt));

		const core = createAuth({
			autoLogin: false,
			requireData: true,
			clientId: "myClientID",
			authorizationEndpoint: "myAuthEndpoint",
			tokenEndpoint: "myTokenEndpoint",
			redirectUri: "http://localhost/",
			decodeToken: true,
			mapTokenData: (data): Claims => data as Claims,
			mapIdTokenData: (data): Claims => data as Claims,
		});

		const StrictConsumer = () => {
			useAuthenticatedAuth(core);
			return <div>ok</div>;
		};

		expect(() => render(<StrictConsumer />)).toThrow(
			"Expected non-null tokenData",
		);
	});

	test("returns typed, non-null claims in requireData mode", () => {
		localStorage.setItem("ROCP_token", JSON.stringify(jwt));
		localStorage.setItem("ROCP_tokenExpire", JSON.stringify(9999999999));
		localStorage.setItem("ROCP_idToken", JSON.stringify(jwt));

		const core = createAuth({
			autoLogin: false,
			requireData: true,
			clientId: "myClientID",
			authorizationEndpoint: "myAuthEndpoint",
			tokenEndpoint: "myTokenEndpoint",
			redirectUri: "http://localhost/",
			decodeToken: true,
			mapTokenData: (data): Claims => data as Claims,
			mapIdTokenData: (data): Claims => data as Claims,
		});

		const StrictConsumer = () => {
			const auth = useAuthenticatedAuth(core);
			return (
				<>
					<div data-testid="name">{auth.tokenData.name}</div>
					<div data-testid="sub">{auth.idTokenData.sub}</div>
				</>
			);
		};

		render(<StrictConsumer />);
		expect(screen.getByTestId("name").textContent).toBe("John Doe");
		expect(screen.getByTestId("sub").textContent).toBe("1234567890");
	});
});
