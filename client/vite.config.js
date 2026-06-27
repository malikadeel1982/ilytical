import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development, proxy /api requests to the Express backend so the
// frontend doesn't need to know the backend URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
