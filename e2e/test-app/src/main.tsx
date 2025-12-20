import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfigurableAuth } from "./pages/ConfigurableAuth";
import { Home } from "./pages/Home";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/configurable/*" element={<ConfigurableAuth />} />
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);
