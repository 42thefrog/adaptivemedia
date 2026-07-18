import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  root: "web",
  plugins: [viteSingleFile()],
  build: {
    outDir: "nextbound-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./nextbound.html", import.meta.url)),
    },
  },
  server: { host: "127.0.0.1", port: 4174 },
});
