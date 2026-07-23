import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// In dev, Vite serves the SPA on :5175 and proxies API + SSE to the
// Express backend on :3000 so the browser sees a single origin.
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // stellar-base references `global` in the browser bundle; map it to globalThis
  // (the Buffer polyfill itself is set up in main.ts).
  define: { global: "globalThis" },
  server: {
    port: 5175,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        // /api/stream is Server-Sent Events: keep it unbuffered.
        ws: false,
      },
    },
  },
});
