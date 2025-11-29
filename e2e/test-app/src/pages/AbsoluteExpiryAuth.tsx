import { useContext, useEffect, useState } from 'react'
import {
  AuthContext,
  AuthProvider,
  type TAuthConfig,
  type IAuthContext,
  type TRefreshTokenExpiredEvent,
} from 'react-oauth2-code-pkce'

// Track callback invocations for testing absolute expiry
declare global {
  interface Window {
    absoluteRefreshExpiredCallbackInvoked: boolean
    absoluteRefreshExpiredEvent: TRefreshTokenExpiredEvent | null
    absoluteTokenRefreshCount: number
  }
}
window.absoluteRefreshExpiredCallbackInvoked = false
window.absoluteRefreshExpiredEvent = null
window.absoluteTokenRefreshCount = 0

const authConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/absolute-expiry/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'absolute_',
  // Short expiry times for testing absolute strategy
  tokenExpiresIn: 5, // 5 seconds
  refreshTokenExpiresIn: 30, // 30 seconds - absolute lifetime
  refreshTokenExpiryStrategy: 'absolute', // Key difference: doesn't renew on use
  refreshWithScope: true,
  onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => {
    console.log('Absolute: Refresh token expired callback invoked')
    window.absoluteRefreshExpiredCallbackInvoked = true
    window.absoluteRefreshExpiredEvent = event
  },
}

function AuthStatus() {
  const { token, tokenData, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)
  const [refreshCallbackStatus, setRefreshCallbackStatus] = useState('not-invoked')
  const [tokenRefreshCount, setTokenRefreshCount] = useState(0)
  const [lastToken, setLastToken] = useState('')

  // Track token changes to count refreshes
  useEffect(() => {
    if (token && token !== lastToken && lastToken !== '') {
      window.absoluteTokenRefreshCount++
      setTokenRefreshCount(window.absoluteTokenRefreshCount)
    }
    setLastToken(token)
  }, [token, lastToken])

  // Check callback status
  const checkCallback = () => {
    if (window.absoluteRefreshExpiredCallbackInvoked) {
      setRefreshCallbackStatus('invoked')
    }
  }

  // Get storage values for debugging
  const getStorageInfo = () => {
    return {
      tokenExpire: sessionStorage.getItem('absolute_tokenExpire'),
      refreshTokenExpire: sessionStorage.getItem('absolute_refreshTokenExpire'),
      refreshInProgress: sessionStorage.getItem('absolute_refreshInProgress'),
      currentTime: Math.round(Date.now() / 1000),
    }
  }

  const [storageInfo, setStorageInfo] = useState(getStorageInfo())

  useEffect(() => {
    const interval = setInterval(() => {
      setStorageInfo(getStorageInfo())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <h2>Absolute Token Expiry Test</h2>

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
        <button onClick={checkCallback} data-testid='check-callback'>
          Check Callback Status
        </button>
      </div>

      {/* Status indicators */}
      <div style={{ marginTop: '20px' }}>
        <h3>Refresh Token Expired Callback</h3>
        <span data-testid='callback-status'>{refreshCallbackStatus}</span>

        <h3>Token Refresh Count</h3>
        <span data-testid='refresh-count'>{tokenRefreshCount}</span>
      </div>

      {/* Storage debugging info */}
      <div style={{ marginTop: '20px' }}>
        <h3>Storage Info</h3>
        <pre data-testid='storage-info'>{JSON.stringify(storageInfo, null, 2)}</pre>
      </div>

      {/* Token expiry info */}
      {token && (
        <div style={{ marginTop: '20px' }}>
          <h3>Configuration</h3>
          <ul>
            <li data-testid='config-token-expires'>Token Expires In: 5 seconds</li>
            <li data-testid='config-refresh-expires'>Refresh Token Expires In: 30 seconds (absolute)</li>
            <li data-testid='config-strategy'>Expiry Strategy: absolute</li>
          </ul>

          <h3>Token Data</h3>
          <pre data-testid='token-data'>{JSON.stringify(tokenData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export function AbsoluteExpiryAuth() {
  return (
    <AuthProvider authConfig={authConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
