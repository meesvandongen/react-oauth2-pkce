import { useContext } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

// Config with clearURL: false to keep state params in URL
const clearURLConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/clear-url/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: false, // Don't clear URL params
  storage: 'session',
  storageKeyPrefix: 'clearurl_',
}

function AuthStatus() {
  const { token, tokenData, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)

  return (
    <div>
      <h2>Clear URL Test (clearURL: false)</h2>

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

      {/* URL info */}
      <div style={{ marginTop: '20px' }}>
        <h3>Current URL</h3>
        <pre data-testid='current-url'>{window.location.href}</pre>
      </div>

      {/* Token info */}
      {token && (
        <div style={{ marginTop: '20px' }}>
          <h3>Configuration</h3>
          <ul>
            <li data-testid='config-clear-url'>Clear URL: false</li>
          </ul>

          <h3>Token Data</h3>
          <pre data-testid='token-data'>{JSON.stringify(tokenData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export function ClearURLAuth() {
  return (
    <AuthProvider authConfig={clearURLConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
