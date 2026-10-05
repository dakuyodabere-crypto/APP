import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@/components", replacement: resolve(__dirname, "components") },
      { find: "@/lib", replacement: resolve(__dirname, "lib") },
      { find: "@/context", replacement: resolve(__dirname, "context") },
      { find: "@/pages", replacement: resolve(__dirname, "pages") },
      { find: "@", replacement: resolve(__dirname) },
    ],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
