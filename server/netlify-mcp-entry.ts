import { handleMcpRequest } from "./mcp-handler.js";

export default async (request: Request): Promise<Response> =>
  handleMcpRequest(request);
