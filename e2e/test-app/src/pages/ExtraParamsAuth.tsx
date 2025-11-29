import { useContext, useState, useEffect } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

const authConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/extraparams/',
  logoutEndpoint: 'http://localhost:5556/dex/logout',
  logoutRedirect: 'http://localhost:3010/extraparams/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'extra_',
  // Extra parameters feature
  extraAuthParameters: {
    prompt: 'consent',
    custom_auth_param: 'auth_value',
  },
  extraTokenParameters: {
    custom_token_param: 'token_value',
  },
  extraLogoutParameters: {
    custom_logout_param: 'logout_value',
  },
}

function AuthStatus() {
  const { token, tokenData, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)
  const [urlParams, setUrlParams] = useState<string>('')
  const [additionalParams, setAdditionalParams] = useState({
    login_hint: 'admin@example.com',
    acr_values: 'urn:example:acr',
  })

  // Capture URL params before they get cleared
  useEffect(() => {
    setUrlParams(window.location.search)
  }, [])

  const handleLoginWithAdditional = () => {
    logIn(undefined, additionalParams)
  }

  const handleLogoutWithState = () => {
    logOut('logout-state', 'admin@example.com', { custom_logout_runtime: 'runtime_value' })
  }

  return (
    <div>
      <h2>Extra Parameters Test</h2>

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

      {/* Configuration display */}
      <div style={{ marginTop: '20px' }}>
        <h3>Configured Extra Parameters</h3>
        <pre data-testid='config-params'>
          {JSON.stringify(
            {
              extraAuthParameters: authConfig.extraAuthParameters,
              extraTokenParameters: authConfig.extraTokenParameters,
              extraLogoutParameters: authConfig.extraLogoutParameters,
            },
            null,
            2
          )}
        </pre>
      </div>

      {/* URL params captured */}
      {urlParams && (
        <div style={{ marginTop: '20px' }}>
          <h3>URL Parameters (before clear)</h3>
          <pre data-testid='url-params'>{urlParams}</pre>
        </div>
      )}

      {/* Runtime additional parameters */}
      <div style={{ marginTop: '20px' }}>
        <h3>Runtime Additional Parameters</h3>
        <div>
          <label>
            login_hint:
            <input
              type='text'
              value={additionalParams.login_hint}
              onChange={(e) => setAdditionalParams({ ...additionalParams, login_hint: e.target.value })}
              data-testid='login-hint-input'
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => logIn()} data-testid='login-button'>
          Log In (config params only)
        </button>
        <button onClick={handleLoginWithAdditional} data-testid='login-additional-params'>
          Log In (with runtime params)
        </button>
        <button onClick={() => logOut()} data-testid='logout-button'>
          Log Out (config params only)
        </button>
        <button onClick={handleLogoutWithState} data-testid='logout-with-state'>
          Log Out (with state & hint)
        </button>
      </div>

      {token && tokenData && (
        <div style={{ marginTop: '20px' }}>
          <h3>Token Data</h3>
          <pre data-testid='token-data'>{JSON.stringify(tokenData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export function ExtraParamsAuth() {
  return (
    <AuthProvider authConfig={authConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
