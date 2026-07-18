import { handleMcpRequest } from "./mcp-handler.js";

// Netlify Function (Web API). This file is pre-bundled by `npm run build:netlify-fn`
// into netlify/functions/mcp.mjs (node_bundler = "none"), which avoids Netlify's
// own esbuild following the server graph into frontend CSS imports.
// Served at the default endpoint /.netlify/functions/mcp; netlify.toml rewrites
// /mcp and /health to it (config.path isn't reliably read from a prebuilt .mjs).
export default async (req: Request): Promise<Response> => handleMcpRequest(req);
