import { useContext } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

// Config for testing refreshWithScope: false
const noScopeRefreshConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/no-scope-refresh/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'noscope_',
  tokenExpiresIn: 10,
  refreshTokenExpiresIn: 60,
  refreshWithScope: false, // Don't send scope during refresh
}

function AuthStatus() {
  const { token, tokenData, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)

  return (
    <div>
      <h2>Refresh Without Scope Test</h2>

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
          Log Out
        </button>
      </div>

      {/* Configuration info */}
      <div style={{ marginTop: '20px' }}>
        <h3>Configuration</h3>
        <ul>
          <li data-testid='config-refresh-with-scope'>Refresh With Scope: false</li>
          <li data-testid='config-token-expires'>Token Expires In: 10 seconds</li>
        </ul>
      </div>

      {/* Token info */}
      {token && (
        <div style={{ marginTop: '20px' }}>
          <h3>Token Data</h3>
          <pre data-testid='token-data'>{JSON.stringify(tokenData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export function NoScopeRefreshAuth() {
  return (
    <AuthProvider authConfig={noScopeRefreshConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
