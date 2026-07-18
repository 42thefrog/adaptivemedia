import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

// Self-contained single-file build for the artifact-feed MCP App widget.
// No CDN dependencies: React, CSS and JS are inlined into one HTML file that
// the MCP server serves as the ui://adaptive-media/artifact-feed.html resource.
export default defineConfig({
  root: "web",
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "artifact-feed-dist",
    emptyOutDir: true,
    assetsInlineLimit: 10_000_000,
    rollupOptions: {
      input: fileURLToPath(new URL("./artifact-feed.html", import.meta.url)),
    },
  },
  server: { host: "127.0.0.1", port: 4176 },
});
