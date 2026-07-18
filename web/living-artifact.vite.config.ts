import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: "web",
  plugins: [],
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/living-artifact"),
    },
  },
  build: {
    outDir: "living-artifact-dist",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./living-artifact.html", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 4176,
    watch: {
      ignored: ["**/dist/**", "**/*-dist/**", "**/node_modules/**"],
    },
  },
});
