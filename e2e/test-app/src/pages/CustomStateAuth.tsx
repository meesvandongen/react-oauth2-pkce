import { useContext, useState, useEffect } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

const authConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/customstate/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'customstate_',
  state: 'default-state-value', // Default state in config
}

function AuthStatus() {
  const { token, tokenData, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)
  const [customState, setCustomState] = useState('my-custom-state')
  const [receivedState, setReceivedState] = useState<string | null>(null)

  // Check for state in URL on mount (before it gets cleared)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const state = urlParams.get('state')
    if (state) {
      setReceivedState(state)
    }
    // Also check session storage for the saved state
    const savedState = sessionStorage.getItem('ROCP_auth_state')
    if (savedState) {
      setReceivedState(savedState)
    }
  }, [])

  return (
    <div>
      <h2>Custom State Test</h2>

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

      {/* Custom state input */}
      <div style={{ marginTop: '20px' }}>
        <label>
          Custom State Value:
          <input
            type='text'
            value={customState}
            onChange={(e) => setCustomState(e.target.value)}
            data-testid='state-input'
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => logIn()} data-testid='login-default-state'>
          Log In (default state)
        </button>
        <button onClick={() => logIn(customState)} data-testid='login-custom-state'>
          Log In (custom state)
        </button>
        <button onClick={() => logOut()} data-testid='logout-button'>
          Log Out
        </button>
      </div>

      {/* Display received state */}
      {receivedState && (
        <div style={{ marginTop: '20px' }}>
          <h3>Received State</h3>
          <pre data-testid='received-state'>{receivedState}</pre>
        </div>
      )}

      {token && tokenData && (
        <div style={{ marginTop: '20px' }}>
          <h3>Token Data</h3>
          <pre data-testid='token-data'>{JSON.stringify(tokenData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export function CustomStateAuth() {
  return (
    <AuthProvider authConfig={authConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
