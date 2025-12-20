/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "happy-dom",
		environmentOptions: {
			happyDom: {
				url: "https://www.example.com",
			},
		},
		include: ["./tests/**/*.{test,spec}.{ts,tsx}"],
	},
});
