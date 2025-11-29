import { useContext } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

// Config with decodeToken: false for opaque tokens
const opaqueTokenConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/opaque-token/',
  scope: 'openid profile email offline_access',
  decodeToken: false, // Don't decode - for opaque tokens
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'opaque_',
}

function AuthStatus() {
  const { token, tokenData, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)

  return (
    <div>
      <h2>Opaque Token Test (decodeToken: false)</h2>

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

      {/* Token info */}
      {token && (
        <div style={{ marginTop: '20px' }}>
          <h3>Configuration</h3>
          <ul>
            <li data-testid='config-decode-token'>Decode Token: false</li>
          </ul>

          <h3>Token Data (should be undefined)</h3>
          <pre data-testid='token-data'>
            {tokenData !== undefined ? JSON.stringify(tokenData, null, 2) : 'undefined'}
          </pre>

          <h3>Access Token</h3>
          <pre data-testid='access-token'>{token}</pre>
        </div>
      )}
    </div>
  )
}

export function OpaqueTokenAuth() {
  return (
    <AuthProvider authConfig={opaqueTokenConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
