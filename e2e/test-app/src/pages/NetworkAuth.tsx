import { useContext } from 'react'
import {
  AuthContext,
  AuthProvider,
  type TAuthConfig,
  type IAuthContext,
  type TRefreshTokenExpiredEvent,
} from 'react-oauth2-code-pkce'

// Track network-related events
declare global {
  interface Window {
    networkRefreshExpiredCallbackInvoked: boolean
    networkRefreshExpiredEvent: TRefreshTokenExpiredEvent | null
    networkErrorCount: number
  }
}
window.networkRefreshExpiredCallbackInvoked = false
window.networkRefreshExpiredEvent = null
window.networkErrorCount = 0

const authConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/network/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'network_',
  tokenExpiresIn: 10,
  refreshTokenExpiresIn: 60,
  onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => {
    console.log('Network: Refresh token expired callback invoked')
    window.networkRefreshExpiredCallbackInvoked = true
    window.networkRefreshExpiredEvent = event
  },
}

function AuthStatus() {
  const { token, tokenData, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)

  // Track errors
  if (error) {
    window.networkErrorCount++
  }

  return (
    <div>
      <h2>Network Resilience Test</h2>

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

      {/* Error tracking */}
      <div style={{ marginTop: '20px' }}>
        <h3>Error Count</h3>
        <span data-testid='error-count'>{window.networkErrorCount}</span>

        <h3>Refresh Expired Callback</h3>
        <span data-testid='callback-status'>
          {window.networkRefreshExpiredCallbackInvoked ? 'invoked' : 'not-invoked'}
        </span>
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

export function NetworkAuth() {
  return (
    <AuthProvider authConfig={authConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
