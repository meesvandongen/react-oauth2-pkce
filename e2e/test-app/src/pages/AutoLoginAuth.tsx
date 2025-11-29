import { useContext, useEffect, useState } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

const authConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/autologin/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: true, // Key feature: auto-login
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'autologin_',
}

function AuthStatus() {
  const { token, tokenData, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)
  const [autoLoginTriggered, setAutoLoginTriggered] = useState(false)

  useEffect(() => {
    // Track if auto-login was triggered (will redirect immediately)
    if (!token && !loginInProgress && !error) {
      setAutoLoginTriggered(true)
    }
  }, [token, loginInProgress, error])

  return (
    <div>
      <h2>Auto Login Test</h2>

      <div data-testid='auth-status'>
        {loginInProgress && <span data-testid='login-in-progress'>Login in progress...</span>}
        {error && (
          <div className='error' data-testid='auth-error'>
            {error}
          </div>
        )}
        {token && <span data-testid='authenticated'>Authenticated</span>}
        {autoLoginTriggered && <span data-testid='auto-login-triggered'>Auto-login triggered</span>}
      </div>

      {token && (
        <>
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => logOut()} data-testid='logout-button'>
              Log Out
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h3>Token Data</h3>
            <pre data-testid='token-data'>{JSON.stringify(tokenData, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  )
}

export function AutoLoginAuth() {
  return (
    <AuthProvider authConfig={authConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
