import { useContext } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

// Config using localStorage for cross-tab testing
const authConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/multitab/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'local', // localStorage for cross-tab sync
  storageKeyPrefix: 'multitab_',
  tokenExpiresIn: 30,
  refreshTokenExpiresIn: 120,
  refreshTokenExpiryStrategy: 'renewable',
}

function AuthStatus() {
  const { token, tokenData, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)

  // Get storage values for debugging
  const getStorageInfo = () => {
    return {
      token: localStorage.getItem('multitab_token')?.substring(0, 30) + '...',
      tokenExpire: localStorage.getItem('multitab_tokenExpire'),
      refreshToken: localStorage.getItem('multitab_refreshToken')?.substring(0, 30) + '...',
      refreshInProgress: localStorage.getItem('multitab_refreshInProgress'),
      loginInProgress: localStorage.getItem('multitab_loginInProgress'),
      currentTime: Math.round(Date.now() / 1000),
    }
  }

  return (
    <div>
      <h2>Multi-Tab Test</h2>

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

      {/* Storage info for cross-tab debugging */}
      <div style={{ marginTop: '20px' }}>
        <h3>Storage Info</h3>
        <pre data-testid='storage-info'>{JSON.stringify(getStorageInfo(), null, 2)}</pre>
      </div>

      {/* Token info */}
      {token && (
        <div style={{ marginTop: '20px' }}>
          <h3>Configuration</h3>
          <ul>
            <li>Storage: localStorage (cross-tab)</li>
            <li>Token Expires In: 30 seconds</li>
            <li>Refresh Token Expires In: 120 seconds</li>
          </ul>

          <h3>Token Data</h3>
          <pre data-testid='token-data'>{JSON.stringify(tokenData, null, 2)}</pre>

          <h3>Access Token (first 50 chars)</h3>
          <pre data-testid='access-token'>{token.substring(0, 50)}...</pre>
        </div>
      )}
    </div>
  )
}

export function MultiTabAuth() {
  return (
    <AuthProvider authConfig={authConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
