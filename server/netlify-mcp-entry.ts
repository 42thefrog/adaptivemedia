import { handleMcpRequest } from "./mcp-handler.js";

// Netlify Function (Web API). This file is pre-bundled by `npm run build:netlify-fn`
// into netlify/functions/mcp.mjs (node_bundler = "none"), which avoids Netlify's
// own esbuild following the server graph into frontend CSS imports.
export default async (req: Request): Promise<Response> => handleMcpRequest(req);

export const config = { path: ["/mcp", "/health"] };
