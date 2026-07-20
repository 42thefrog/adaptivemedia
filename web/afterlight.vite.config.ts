import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { renameSync } from "node:fs";
import { resolve } from "node:path";
import { viteSingleFile } from "vite-plugin-singlefile";

const publishAsLegacyNextboundPath = () => ({
  name: "publish-as-legacy-nextbound-path",
  closeBundle() {
    renameSync(
      resolve("web/afterlight-dist/afterlight.html"),
      resolve("web/afterlight-dist/nextbound.html"),
    );
  },
});

export default defineConfig({
  root: "web",
  publicDir: "public",
  plugins: [react(), viteSingleFile(), publishAsLegacyNextboundPath()],
  build: {
    // The widget HTML is an MCP resource; keep it compact and ship artwork as
    // static files from the verified Netlify origin.
    assetsInlineLimit: 0,
    outDir: "afterlight-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./afterlight.html", import.meta.url)),
    },
  },
  server: { host: "127.0.0.1", port: 4175 },
});
