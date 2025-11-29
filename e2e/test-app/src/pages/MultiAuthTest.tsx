import { useContext, useEffect, useState } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

// Two different auth configs with different prefixes
const authConfig1: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/multiauth/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'auth1_',
  state: 'auth1-state',
}

const authConfig2: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/multiauth/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'session',
  storageKeyPrefix: 'auth2_',
  state: 'auth2-state',
}

function AuthStatus1() {
  const { token, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)

  return (
    <div style={{ border: '1px solid blue', padding: '10px', margin: '10px' }}>
      <h3>Auth Provider 1 (auth1_)</h3>
      <div data-testid='auth1-status'>
        {loginInProgress && <span data-testid='auth1-login-in-progress'>Login in progress...</span>}
        {error && (
          <div className='error' data-testid='auth1-error'>
            {error}
          </div>
        )}
        {token && <span data-testid='auth1-authenticated'>Authenticated</span>}
        {!token && !loginInProgress && <span data-testid='auth1-not-authenticated'>Not authenticated</span>}
      </div>
      <button onClick={() => logIn()} data-testid='auth1-login-button'>
        Log In
      </button>
      <button onClick={() => logOut()} data-testid='auth1-logout-button'>
        Log Out
      </button>
    </div>
  )
}

function AuthStatus2() {
  const { token, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)

  return (
    <div style={{ border: '1px solid green', padding: '10px', margin: '10px' }}>
      <h3>Auth Provider 2 (auth2_)</h3>
      <div data-testid='auth2-status'>
        {loginInProgress && <span data-testid='auth2-login-in-progress'>Login in progress...</span>}
        {error && (
          <div className='error' data-testid='auth2-error'>
            {error}
          </div>
        )}
        {token && <span data-testid='auth2-authenticated'>Authenticated</span>}
        {!token && !loginInProgress && <span data-testid='auth2-not-authenticated'>Not authenticated</span>}
      </div>
      <button onClick={() => logIn()} data-testid='auth2-login-button'>
        Log In
      </button>
      <button onClick={() => logOut()} data-testid='auth2-logout-button'>
        Log Out
      </button>
    </div>
  )
}

function StorageInspector() {
  const [storage, setStorage] = useState<Record<string, string>>({})

  useEffect(() => {
    const updateStorage = () => {
      const items: Record<string, string> = {}
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          items[key] = sessionStorage.getItem(key) || ''
        }
      }
      setStorage(items)
    }
    updateStorage()
    const interval = setInterval(updateStorage, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ border: '1px solid gray', padding: '10px', margin: '10px' }}>
      <h3>Session Storage Inspector</h3>
      <pre data-testid='storage-contents'>{JSON.stringify(storage, null, 2)}</pre>
    </div>
  )
}

export function MultiAuthTest() {
  return (
    <div>
      <h2>Multi Auth Provider Test</h2>
      <p>This page has two AuthProviders with different prefixes to test state key collision.</p>

      <AuthProvider authConfig={authConfig1}>
        <AuthStatus1 />
      </AuthProvider>

      <AuthProvider authConfig={authConfig2}>
        <AuthStatus2 />
      </AuthProvider>

      <StorageInspector />
    </div>
  )
}
