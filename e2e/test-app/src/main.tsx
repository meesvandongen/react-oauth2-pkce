import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AutoLoginAuth } from "./pages/AutoLoginAuth";
import { BasicAuth } from "./pages/BasicAuth";
import { ExtraParamsAuth } from "./pages/ExtraParamsAuth";
import { Home } from "./pages/Home";
import { LocalStorageAuth } from "./pages/LocalStorageAuth";
import { MultiAuthTest } from "./pages/MultiAuthTest";
import { MultiTabAuth } from "./pages/MultiTabAuth";
import { NetworkAuth } from "./pages/NetworkAuth";
import { NoScopeRefreshAuth } from "./pages/NoScopeRefreshAuth";
import { OpaqueTokenAuth } from "./pages/OpaqueTokenAuth";
import { PrePostLoginAuth } from "./pages/PrePostLoginAuth";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/basic/*" element={<BasicAuth />} />
				<Route path="/autologin/*" element={<AutoLoginAuth />} />
				<Route path="/localstorage/*" element={<LocalStorageAuth />} />
				<Route path="/prepostlogin/*" element={<PrePostLoginAuth />} />
				<Route path="/extraparams/*" element={<ExtraParamsAuth />} />
				<Route path="/multiauth/*" element={<MultiAuthTest />} />
				<Route path="/multitab/*" element={<MultiTabAuth />} />
				<Route path="/network/*" element={<NetworkAuth />} />
				<Route path="/opaque-token/*" element={<OpaqueTokenAuth />} />
				<Route path="/no-scope-refresh/*" element={<NoScopeRefreshAuth />} />
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);
