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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts";
          }
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
            return "react-vendor";
          }
          if (id.includes("lucide-react") || id.includes("sonner") || id.includes("axios")) {
            return "ui-vendor";
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
