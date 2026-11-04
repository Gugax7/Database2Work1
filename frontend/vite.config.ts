import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    proxy: {
      "/api": {
        target:
          process.env.API_PROXY_TARGET ||
          loadEnv(mode, process.cwd(), "API_PROXY_TARGET").API_PROXY_TARGET ||
          "http://localhost:8080",
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true, // Required for Docker to detect file changes
    },
  },
}));
