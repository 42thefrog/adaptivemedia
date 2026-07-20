#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { AdaptiveMediaService, DemoError } from "./service.js";
import * as api from "./tools/api.js";

const service = new AdaptiveMediaService();
// A versioned URI makes ChatGPT fetch this bundle rather than reusing a
// previously cached widget after a deployment.
const AFTERLIGHT_WIDGET_URI = "ui://nextbound/afterlight-v2.html";

const afterlightMeta = {
  ui: { resourceUri: AFTERLIGHT_WIDGET_URI },
  "openai/outputTemplate": AFTERLIGHT_WIDGET_URI,
  "openai/toolInvocation/invoking": "Nextbound is building your experience…",
  "openai/toolInvocation/invoked": "Your personal experience is ready",
};

const result = (structuredContent: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: JSON.stringify(structuredContent) }],
  structuredContent,
});

const safe =
  <T extends unknown[]>(fn: (...args: T) => Record<string, unknown>) =>
  async (...args: T) => {
    try {
      return result(fn(...args));
    } catch (error) {
      const message =
        error instanceof DemoError
          ? error.message
          : "The request could not be completed.";
      return { ...result({ error: { message } }), isError: true };
    }
  };

export function makeMcpServer() {
  const server = new McpServer({ name: "nextbound", version: "1.0.0" });
  const read = {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  };

  server.registerResource(
    "nextbound-afterlight",
    AFTERLIGHT_WIDGET_URI,
    {
      title: "Nextbound personal experience",
      description: "One creator artifact, rendered for one person.",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => ({
      contents: [
        {
          uri: AFTERLIGHT_WIDGET_URI,
          mimeType: "text/html;profile=mcp-app",
          text: readFileSync(
            resolve(process.cwd(), "web/afterlight-dist/nextbound.html"),
            "utf8",
          ),
          _meta: {
            ui: {
              prefersBorder: false,
              domain: "https://nextbound-adaptive-media.netlify.app",
              csp: { connectDomains: [], resourceDomains: [] },
            },
            "openai/widgetDescription":
              "An interactive Nextbound personal artifact with Alex, Camille, and Maya views.",
          },
        },
      ],
    }),
  );

  server.registerTool(
    "search_public_intents",
    {
      title: "Search creator content",
      description: "Find a published creator Intent to personalize.",
      inputSchema: api.SearchPublicIntentsInput,
      annotations: read,
    },
    safe((input) => service.searchPublicIntents(input)),
  );
  server.registerTool(
    "get_creator_profile",
    {
      title: "Open creator profile",
      description: "Open a creator and their published content.",
      inputSchema: api.GetCreatorProfileInput,
      annotations: read,
    },
    safe(({ creatorId }) => service.getCreatorProfile(creatorId)),
  );
  server.registerTool(
    "get_intent",
    {
      title: "Open original content",
      description: "Inspect a creator's original content before rendering it.",
      inputSchema: api.GetIntentInput,
      annotations: read,
    },
    safe(({ intentId }) => service.getIntent(intentId)),
  );
  server.registerTool(
    "generate_experience",
    {
      title: "Render a personal Nextbound experience",
      description:
        "Show the interactive AFTERLIGHT visual artifact for Alex, Camille, or Maya. Use this tool whenever the user asks to generate, open, or view a personal Nextbound experience.",
      inputSchema: api.GenerateExperienceInput,
      outputSchema: { experience: z.unknown() },
      annotations: read,
      _meta: afterlightMeta,
    },
    safe(({ intentId, personaId }) =>
      service.generateExperience(intentId, personaId),
    ),
  );

  return server;
}

if (process.env.AM_SERVERLESS !== "1") {
  const port = Number(process.env.PORT ?? 3000);
  const httpServer = createServer(async (req, res) => {
    const pathname = new URL(
      req.url ?? "/",
      `http://${req.headers.host ?? "localhost"}`,
    ).pathname;
    if (pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok", endpoint: "/mcp" }));
      return;
    }
    if (pathname !== "/mcp") {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "not_found" }));
      return;
    }
    const server = makeMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res);
  });
  httpServer.listen(port, "127.0.0.1", () =>
    console.error(`Nextbound MCP: http://127.0.0.1:${port}/mcp`),
  );
}
