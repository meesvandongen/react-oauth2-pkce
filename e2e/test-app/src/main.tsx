import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BasicAuth } from './pages/BasicAuth'
import { AutoLoginAuth } from './pages/AutoLoginAuth'
import { LocalStorageAuth } from './pages/LocalStorageAuth'
import { CustomStateAuth } from './pages/CustomStateAuth'
import { RefreshTokenAuth } from './pages/RefreshTokenAuth'
import { PrePostLoginAuth } from './pages/PrePostLoginAuth'
import { ExtraParamsAuth } from './pages/ExtraParamsAuth'
import { MultiAuthTest } from './pages/MultiAuthTest'
import { Home } from './pages/Home'
// New test pages
import { TimingAuth } from './pages/TimingAuth'
import { AbsoluteExpiryAuth } from './pages/AbsoluteExpiryAuth'
import { PopupAuth } from './pages/PopupAuth'
import { MultiTabAuth } from './pages/MultiTabAuth'
import { NetworkAuth } from './pages/NetworkAuth'
import { OpaqueTokenAuth } from './pages/OpaqueTokenAuth'
import { ClearURLAuth } from './pages/ClearURLAuth'
import { LogoutTestAuth } from './pages/LogoutTestAuth'
import { NoScopeRefreshAuth } from './pages/NoScopeRefreshAuth'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/basic/*' element={<BasicAuth />} />
        <Route path='/autologin/*' element={<AutoLoginAuth />} />
        <Route path='/localstorage/*' element={<LocalStorageAuth />} />
        <Route path='/customstate/*' element={<CustomStateAuth />} />
        <Route path='/refresh/*' element={<RefreshTokenAuth />} />
        <Route path='/prepostlogin/*' element={<PrePostLoginAuth />} />
        <Route path='/extraparams/*' element={<ExtraParamsAuth />} />
        <Route path='/multiauth/*' element={<MultiAuthTest />} />
        {/* New test routes */}
        <Route path='/timing/*' element={<TimingAuth />} />
        <Route path='/absolute-expiry/*' element={<AbsoluteExpiryAuth />} />
        <Route path='/popup/*' element={<PopupAuth />} />
        <Route path='/multitab/*' element={<MultiTabAuth />} />
        <Route path='/network/*' element={<NetworkAuth />} />
        <Route path='/opaque-token/*' element={<OpaqueTokenAuth />} />
        <Route path='/clear-url/*' element={<ClearURLAuth />} />
        <Route path='/logout-test/*' element={<LogoutTestAuth />} />
        <Route path='/no-scope-refresh/*' element={<NoScopeRefreshAuth />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
