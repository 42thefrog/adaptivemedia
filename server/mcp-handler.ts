import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

/**
 * Framework-agnostic MCP handler: takes a Web `Request` and returns a Web
 * `Response`, so it runs inside a serverless function (Netlify) or any
 * Web-Standards runtime. Uses the SDK's Web-Standard Streamable-HTTP transport
 * in stateless JSON mode (one JSON-RPC request/response per call — no SSE),
 * which keeps the serverless response non-streaming.
 */
export async function handleMcpRequest(request: Request): Promise<Response> {
  // Ensure importing the server module does not bind a TCP port.
  process.env.AM_SERVERLESS = "1";
  const { makeMcpServer } = await import("./index.js");

  const url = new URL(request.url);
  if (url.pathname.endsWith("/health") || url.pathname.endsWith("/healthz")) {
    return Response.json({
      status: "ok",
      service: "adaptive-media",
      version: "0.2.0",
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
