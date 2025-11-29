import { useContext } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

const authConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/basic/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'basic_',
}

function AuthStatus() {
  const { token, tokenData, idToken, idTokenData, logIn, logOut, error, loginInProgress }: IAuthContext =
    useContext(AuthContext)

  return (
    <div>
      <h2>Basic Authentication Test</h2>

      {/* Status indicators for testing */}
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

      {/* Action buttons */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => logIn()} data-testid='login-button'>
          Log In (redirect)
        </button>
        <button onClick={() => logIn(undefined, undefined, 'replace')} data-testid='login-replace-button'>
          Log In (replace)
        </button>
        <button onClick={() => logOut()} data-testid='logout-button'>
          Log Out
        </button>
      </div>

      {/* Token display for verification */}
      {token && (
        <div style={{ marginTop: '20px' }}>
          <h3>Access Token</h3>
          <pre data-testid='access-token'>{token}</pre>

          {tokenData && (
            <>
              <h3>Decoded Token Data</h3>
              <pre data-testid='token-data'>{JSON.stringify(tokenData, null, 2)}</pre>
            </>
          )}

          {idToken && (
            <>
              <h3>ID Token</h3>
              <pre data-testid='id-token'>{idToken}</pre>
            </>
          )}

          {idTokenData && (
            <>
              <h3>Decoded ID Token Data</h3>
              <pre data-testid='id-token-data'>{JSON.stringify(idTokenData, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function BasicAuth() {
  return (
    <AuthProvider authConfig={authConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
