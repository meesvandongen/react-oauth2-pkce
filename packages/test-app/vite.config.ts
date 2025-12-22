import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3010,
		host: true,
	},
	resolve: {
		tsconfigPaths: true,
	},
});
