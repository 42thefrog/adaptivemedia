#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { AdaptiveMediaService, DemoError } from "./service.js";
import * as api from "./tools/api.js";

const service = new AdaptiveMediaService();
const widgetTemplate = readFileSync(
  resolve(process.cwd(), "web/mcp-widget.html"),
  "utf8",
);

const artifacts = {
  alex: {
    name: "Alex", role: "CEO, tech company", collection: "NIHE | Executive Series",
    headline: "Comfort that moves<br />with you.", image: "alex-executive-series.jpg", accent: "#679cff",
  },
  camille: {
    name: "Camille", role: "Artistic director", collection: "NIHE | Atelier Édition",
    headline: "The architecture<br />of softness.", image: "camille-atelier-edition.jpg", accent: "#c989bd",
  },
  maya: {
    name: "Maya", role: "Developer", collection: "NIHE | Studio Drop",
    headline: "Built for the<br />creative sprint.", image: "maya-studio-drop.jpg", accent: "#48c892",
  },
} as const;

type Persona = keyof typeof artifacts;
const widgetUri = (persona: Persona) => `ui://nextbound/${persona}-artifact-v1.html`;
const LEGACY_WIDGET_URI = "ui://nextbound/afterlight-v4.html";
const widgetHtml = (persona: Persona) => {
  const artifact = artifacts[persona];
  return widgetTemplate
    .replaceAll("{{NAME}}", artifact.name)
    .replaceAll("{{ROLE}}", artifact.role)
    .replaceAll("{{COLLECTION}}", artifact.collection)
    .replaceAll("{{HEADLINE}}", artifact.headline)
    .replaceAll("{{IMAGE}}", artifact.image)
    .replaceAll("{{ACCENT}}", artifact.accent);
};

const ORIGINAL_WIDGET_URI = "ui://nextbound/original-artifact-v1.html";
const originalHtml = () =>
  widgetTemplate
    .replace(
      "Luna shared one artifact. This is {{NAME}}\u2019s personal version.",
      "This is what Luna published. Everyone sees the same thing.",
    )
    .replace("for {{NAME}} \u00b7 {{ROLE}}", "the original artifact")
    .replaceAll("{{NAME}}", "everyone")
    .replaceAll("{{ROLE}}", "before Nextbound")
    .replaceAll("{{COLLECTION}}", "NIHE | Original")
    .replaceAll("{{HEADLINE}}", "One artifact.<br />Published once.")
    .replaceAll("{{IMAGE}}", "nihe-sneakers.jpg")
    .replaceAll("{{ACCENT}}", "#101114");

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
  const server = new McpServer(
    { name: "nextbound", version: "1.0.0" },
    {
      instructions: [
        "When Nextbound is opened for the first time in a conversation, greet the user with exactly this, before doing anything else:",
        "",
        "Hi! Nextbound was built for OpenAI Build Week. One artifact, a different experience for every person. Try one of these:",
        "",
        "1. Show Luna's artifact for Alex.",
        "2. Show Luna's artifact for Camille.",
        "3. Show Luna's artifact for Maya.",
        "4. Show Luna's original artifact.",
        "",
        "Then wait for the user to choose. Call show_alex_artifact, show_camille_artifact, show_maya_artifact or show_original_artifact, never generate_experience.",
      ].join("\n"),
    },
  );
  const read = {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  };

  (Object.keys(artifacts) as Persona[]).forEach((persona) => {
    server.registerResource(
      `nextbound-${persona}-artifact`, widgetUri(persona),
      { title: `${artifacts[persona].name}'s artifact`, description: `Only ${artifacts[persona].name}'s personal artifact.`, mimeType: "text/html;profile=mcp-app" },
      async () => ({ contents: [{
          uri: widgetUri(persona),
          mimeType: "text/html;profile=mcp-app",
          text: widgetHtml(persona),
          _meta: {
            ui: {
              prefersBorder: false,
              csp: {
                connectDomains: [],
                resourceDomains: ["https://nextbound-adaptive-media.netlify.app"],
              },
            },
            "openai/widgetCSP": {
              connect_domains: [],
              resource_domains: [
                "https://nextbound-adaptive-media.netlify.app",
              ],
            },
            "openai/widgetPrefersBorder": false,
            "openai/widgetDescription":
              `Only ${artifacts[persona].name}'s personal artifact.`,
          },
        }], }),
    );
  });

  server.registerResource(
    "nextbound-original-artifact",
    ORIGINAL_WIDGET_URI,
    {
      title: "Luna's original artifact",
      description: "The unpersonalized artifact, as published.",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => ({
      contents: [
        {
          uri: ORIGINAL_WIDGET_URI,
          mimeType: "text/html;profile=mcp-app",
          text: originalHtml(),
          _meta: {
            ui: {
              prefersBorder: false,
              csp: {
                connectDomains: [],
                resourceDomains: [
                  "https://nextbound-adaptive-media.netlify.app",
                ],
              },
            },
            "openai/widgetCSP": {
              connect_domains: [],
              resource_domains: [
                "https://nextbound-adaptive-media.netlify.app",
              ],
            },
            "openai/widgetDescription":
              "Luna's artifact before any personalization.",
          },
        },
      ],
    }),
  );

  // Older Codex/ChatGPT conversations can retain a previously discovered
  // template URI. Keep this read-only fallback alive so those conversations do
  // not fail with Resource not found while clients refresh their tool list.
  server.registerResource(
    "nextbound-legacy-afterlight",
    LEGACY_WIDGET_URI,
    { title: "Nextbound legacy artifact", mimeType: "text/html;profile=mcp-app" },
    async () => ({
      contents: [{
        uri: LEGACY_WIDGET_URI,
        mimeType: "text/html;profile=mcp-app",
        text: widgetHtml("alex"),
        _meta: { ui: { prefersBorder: false, csp: { connectDomains: [], resourceDomains: ["https://nextbound-adaptive-media.netlify.app"] } } },
      }],
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
  (Object.keys(artifacts) as Persona[]).forEach((persona) => {
    const artifact = artifacts[persona];
    server.registerTool(
      `show_${persona}_artifact`,
      {
        title: `Show ${artifact.name}'s artifact`,
        description: `Show only Luna's personal artifact for ${artifact.name}, ${artifact.role}. Do not show any other persona.`,
        inputSchema: {}, annotations: read,
        _meta: {
          ui: { resourceUri: widgetUri(persona) },
          "openai/outputTemplate": widgetUri(persona),
          "openai/toolInvocation/invoking": `Opening ${artifact.name}'s artifact…`,
          "openai/toolInvocation/invoked": `${artifact.name}'s artifact is ready`,
        },
      },
      async () => {
        const base = await safe(() =>
          service.generateExperience("intent_luna_main_character", persona),
        )();
        // ChatGPT reads the template from the tool *result* meta as well as the
        // descriptor. Without this, the text arrives and the widget stays blank.
        // Some clients fail to fetch the template with a separate
        // resources/read call. Embedding the widget in the tool result makes
        // the response self-sufficient.
        return {
          ...base,
          content: [
            ...base.content,
            {
              type: "resource" as const,
              resource: {
                uri: widgetUri(persona),
                mimeType: "text/html;profile=mcp-app",
                text: widgetHtml(persona),
              },
            },
          ],
          _meta: {
            ui: { resourceUri: widgetUri(persona) },
            "openai/outputTemplate": widgetUri(persona),
          },
        };
      },
    );
  });

  server.registerTool(
    "show_original_artifact",
    {
      title: "Show Luna's original artifact",
      description:
        "Show Luna's original artifact exactly as published, with no personalization. Use it to compare against a persona version.",
      inputSchema: {},
      annotations: read,
      _meta: {
        ui: { resourceUri: ORIGINAL_WIDGET_URI },
        "openai/outputTemplate": ORIGINAL_WIDGET_URI,
        "openai/toolInvocation/invoking": "Opening the original artifact\u2026",
        "openai/toolInvocation/invoked": "The original artifact is ready",
      },
    },
    async () => {
      const base = await safe(() =>
        service.getIntent("intent_luna_main_character"),
      )();
      return {
        ...base,
        content: [
          ...base.content,
          {
            type: "resource" as const,
            resource: {
              uri: ORIGINAL_WIDGET_URI,
              mimeType: "text/html;profile=mcp-app",
              text: originalHtml(),
            },
          },
        ],
        _meta: {
          ui: { resourceUri: ORIGINAL_WIDGET_URI },
          "openai/outputTemplate": ORIGINAL_WIDGET_URI,
        },
      };
    },
  );

  // Compatibility for cached ChatGPT/Codex tool manifests. Fresh clients use
  // the three explicit show_* tools above; older clients can still complete a
  // previously planned generate_experience call instead of failing.
  server.registerTool(
    "generate_experience",
    {
      title: "Generate experience (legacy compatibility)",
      description: "Compatibility alias for an already-open Nextbound conversation.",
      inputSchema: api.GenerateExperienceInput,
      annotations: read,
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
