import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: "web",
  plugins: [react()],
  build: {
    outDir: "artifact-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./artifact.html", import.meta.url)),
    },
  },
  server: { host: "127.0.0.1", port: 4175 },
});
