import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			// Link to the local package source for testing
			"react-oauth2-code-pkce": path.resolve(__dirname, "../../src"),
		},
	},
	server: {
		port: 3010,
		host: true,
	},
});
