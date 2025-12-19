import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div>
      <h1>OAuth2 PKCE Test Application</h1>
      <p>Test pages for different OAuth2 PKCE configurations:</p>
      <nav>
        <ul>
          <li>
            <Link to='/basic' data-testid='link-basic'>
              Basic Authentication
            </Link>
            <p>Standard OAuth2 PKCE flow with session storage</p>
          </li>
          <li>
            <Link to='/autologin' data-testid='link-autologin'>
              Auto Login
            </Link>
            <p>Automatic login redirect when not authenticated</p>
          </li>
          <li>
            <Link to='/localstorage' data-testid='link-localstorage'>
              Local Storage
            </Link>
            <p>Token storage in localStorage instead of sessionStorage</p>
          </li>
          <li>
            <Link to='/customstate' data-testid='link-customstate'>
              Custom State
            </Link>
            <p>Custom state parameter handling</p>
          </li>
          <li>
            <Link to='/prepostlogin' data-testid='link-prepostlogin'>
              Pre/Post Login Hooks
            </Link>
            <p>preLogin and postLogin callback functions</p>
          </li>
          <li>
            <Link to='/extraparams' data-testid='link-extraparams'>
              Extra Parameters
            </Link>
            <p>Extra auth, token, and logout parameters</p>
          </li>
        </ul>
      </nav>
    </div>
  )
}
