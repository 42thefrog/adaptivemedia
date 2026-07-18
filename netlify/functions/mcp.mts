import { handleMcpRequest } from "../../server/mcp-handler.js";

// Netlify Function (Web API): routes /mcp and /health to the MCP server.
export default async (req: Request): Promise<Response> => handleMcpRequest(req);

export const config = { path: ["/mcp", "/health"] };
