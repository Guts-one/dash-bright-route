import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  optimizeDeps: {
    // Prevent Vite from using a stale pre-bundled react-leaflet build.
    // The stale build can contain React 19-only APIs (e.g. React.use for context)
    // which triggers "render2 is not a function" on React 18.
    exclude: ["react-leaflet", "@react-leaflet/core"],
    // Ensure dependency optimization is recomputed after version changes.
    ...(mode === "development" ? { force: true } : {}),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Avoid duplicate React copies (also a common cause of this crash)
    dedupe: ["react", "react-dom"],
  },
}));
