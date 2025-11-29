import { useContext, useEffect, useState } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

// Track popup state for testing
declare global {
  interface Window {
    popupLoginCompleted: boolean
    popupLoginError: string | null
  }
}
window.popupLoginCompleted = false
window.popupLoginError = null

const authConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/popup/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'popup_',
  loginMethod: 'popup', // Default to popup login
  postLogin: () => {
    console.log('Popup: Post login callback invoked')
    window.popupLoginCompleted = true
  },
}

function AuthStatus() {
  const { token, tokenData, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)
  const [popupStatus, setPopupStatus] = useState('idle')

  // Update popup status
  useEffect(() => {
    if (window.popupLoginCompleted) {
      setPopupStatus('completed')
    }
    if (error) {
      window.popupLoginError = error
    }
  }, [token, error])

  return (
    <div>
      <h2>Popup Login Test</h2>

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
        <button onClick={() => logIn(undefined, undefined, 'popup')} data-testid='login-popup-button'>
          Log In (Popup)
        </button>
        <button onClick={() => logIn(undefined, undefined, 'redirect')} data-testid='login-redirect-button'>
          Log In (Redirect)
        </button>
        <button onClick={() => logOut()} data-testid='logout-button'>
          Log Out
        </button>
      </div>

      {/* Popup status */}
      <div style={{ marginTop: '20px' }}>
        <h3>Popup Login Status</h3>
        <span data-testid='popup-status'>{popupStatus}</span>
      </div>

      {/* Token info */}
      {token && (
        <div style={{ marginTop: '20px' }}>
          <h3>Token Data</h3>
          <pre data-testid='token-data'>{JSON.stringify(tokenData, null, 2)}</pre>

          <h3>Access Token (first 50 chars)</h3>
          <pre data-testid='access-token'>{token.substring(0, 50)}...</pre>
        </div>
      )}
    </div>
  )
}

export function PopupAuth() {
  return (
    <AuthProvider authConfig={authConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
