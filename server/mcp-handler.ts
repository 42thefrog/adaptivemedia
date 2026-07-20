import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

export async function handleMcpRequest(request: Request): Promise<Response> {
  process.env.AM_SERVERLESS = "1";
  const { makeMcpServer } = await import("./index.js");
  const url = new URL(request.url);

  if (request.method === "GET" || url.pathname.endsWith("/health")) {
    return Response.json({
      status: "ok",
      service: "adaptive-media",
      transport: "streamable-http",
      endpoint: "/mcp",
    });
  }

  const server = makeMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}
