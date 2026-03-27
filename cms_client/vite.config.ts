import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 25550,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:25551",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "antd",
      "@ant-design/icons",
      "axios",
      "zustand",
      "dayjs",
      "ahooks",
      "html5-qrcode",
    ],
  },
  build: {
    target: "es2022",
    minify: "esbuild",
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/") ||
            id.includes("node_modules/react-router")
          ) {
            return "react-vendor";
          }
          if (
            id.includes("node_modules/antd/") ||
            id.includes("node_modules/@ant-design/")
          ) {
            return "antd-vendor";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
