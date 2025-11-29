import { useContext, useEffect, useState } from 'react'
import { AuthContext, AuthProvider, type TAuthConfig, type IAuthContext } from 'react-oauth2-code-pkce'

const authConfig: TAuthConfig = {
  clientId: 'test-app',
  authorizationEndpoint: 'http://localhost:5556/dex/auth',
  tokenEndpoint: 'http://localhost:5556/dex/token',
  redirectUri: 'http://localhost:3010/localstorage/',
  scope: 'openid profile email offline_access',
  decodeToken: true,
  autoLogin: false,
  clearURL: true,
  storage: 'local', // Key feature: localStorage
  storageKeyPrefix: 'localstorage_',
}

function AuthStatus() {
  const { token, tokenData, logIn, logOut, error, loginInProgress }: IAuthContext = useContext(AuthContext)
  const [storageContents, setStorageContents] = useState<Record<string, string>>({})

  // Display localStorage contents for verification
  useEffect(() => {
    const updateStorage = () => {
      const contents: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('localstorage_')) {
          contents[key] = localStorage.getItem(key) || ''
        }
      }
      setStorageContents(contents)
    }

    updateStorage()
    window.addEventListener('storage', updateStorage)
    const interval = setInterval(updateStorage, 500)

    return () => {
      window.removeEventListener('storage', updateStorage)
      clearInterval(interval)
    }
  }, [token])

  return (
    <div>
      <h2>Local Storage Test</h2>

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

      {/* Storage contents for verification */}
      <div style={{ marginTop: '20px' }}>
        <h3>LocalStorage Contents (prefixed with localstorage_)</h3>
        <pre data-testid='storage-contents'>{JSON.stringify(storageContents, null, 2)}</pre>
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

export function LocalStorageAuth() {
  return (
    <AuthProvider authConfig={authConfig}>
      <AuthStatus />
    </AuthProvider>
  )
}
