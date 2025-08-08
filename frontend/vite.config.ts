import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: [
      "0a935d9cd8b6.ngrok-free.app",
      "localhost",
      "127.0.0.1",
      "stage.dnap.in",
      "dnap.in",
    ],
  },
})
