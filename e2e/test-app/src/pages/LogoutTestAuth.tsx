import { useContext } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

// Config for logout testing with logoutEndpoint
const logoutConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/logout-test/',
  logoutEndpoint: 'http://localhost:5556/dex/logout', // Note: Dex may not have a standard logout endpoint
  logoutRedirect: 'http://localhost:3010/logout-test/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'logouttest_',
  extraLogoutParameters: {
    custom_logout_param: 'test_value',
  },
}

function AuthStatus() {
  const { token, tokenData, idToken, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)

  return (
    <div>
      <h2>Logout Scenarios Test</h2>

      <div data-testid='auth-status'>
        {loginInProgress && <span data-testid='login-in-progress'>Login in progress...</span>}
        {error && (
          <div className='error' data-testid='auth-error'>
            {error}
          </div>
        )}
        {token && <span data-testid='authenticated'>Authenticated</span>}
        {!token && !loginInProgress && <span data-testid='not-authenticated'>Not authenticated</span>}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => logIn()} data-testid='login-button'>
          Log In
        </button>
        <button onClick={() => logOut()} data-testid='logout-button'>
          Log Out (Basic)
        </button>
        <button onClick={() => logOut('logout-state-123')} data-testid='logout-with-state-button'>
          Log Out (With State)
        </button>
        <button onClick={() => logOut(undefined, 'user@example.com')} data-testid='logout-with-hint-button'>
          Log Out (With Hint)
        </button>
        <button
          onClick={() => logOut('state-123', 'user@example.com', { extra_param: 'value' })}
          data-testid='logout-full-button'
        >
          Log Out (Full Params)
        </button>
      </div>

      {/* Configuration info */}
      <div style={{ marginTop: '20px' }}>
        <h3>Logout Configuration</h3>
        <ul>
          <li data-testid='config-logout-endpoint'>Logout Endpoint: http://localhost:5556/dex/logout</li>
          <li data-testid='config-logout-redirect'>Logout Redirect: http://localhost:3010/logout-test/</li>
          <li data-testid='config-extra-params'>Extra Logout Params: custom_logout_param=test_value</li>
        </ul>
      </div>

      {/* Token info */}
      {token && (
        <div style={{ marginTop: '20px' }}>
          <h3>Token Data</h3>
          <pre data-testid='token-data'>{JSON.stringify(tokenData, null, 2)}</pre>

          <h3>ID Token Available</h3>
          <span data-testid='id-token-available'>{idToken ? 'yes' : 'no'}</span>
        </div>
      )}
    </div>
  )
}

export function LogoutTestAuth() {
  return (
    <AuthProvider authConfig={logoutConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
