1. Allow multiple instances of AuthCore to authenticate automatically (via global locking mechanism? spread across multiple tabs (i.e. local storage?)?).
2. middleware for react-router
3. react component for protecting routes
4. userinfo endpoint
5. plugin system for modifying requests, actions upon events, etc.
6. handling of OIDC
7. handling of opaque tokens
8. Discovery endpoint caching
9. If userinfo is enabled, we must be in loading state until userinfo is fetched.
10. Create a list of guarantees provided by the library. e.g. you will always have a valid access token when isAuthenticated is true.

