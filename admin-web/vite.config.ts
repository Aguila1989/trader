import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Completely separate SPA from web/ (Feature 4: admin backoffice). Served by
// Express as static files at /admin in production; in dev, Vite proxies
// /api to the backend so the browser sees a single origin (cookie auth).
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/admin/",
  build: {
    outDir: "dist",
  },
  server: {
    port: 5176,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3105",
        changeOrigin: true,
      },
    },
  },
});
