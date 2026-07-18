#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { NextboundService, NextboundError } from "../nextbound/service.js";
import { knowledgeSchemas, proceduralSchemas, schemas } from "./nextbound-api.js";
import {
  getLocalKnowledgeProfile,
  listLocalKnowledgeProfiles,
} from "./local-knowledge.js";

const NEXTBOUND_WIDGET_URI = "ui://nextbound/experience.html";
const nextbound = new NextboundService();
const json = (res: any, body: unknown, status = 200) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};
const result = (id: unknown, value: unknown) => ({
  jsonrpc: "2.0",
  id,
  result: value,
});
const error = (id: unknown, code: number, message: string) => ({
  jsonrpc: "2.0",
  id,
  error: { code, message },
});
const toolMeta = {
  ui: { resourceUri: NEXTBOUND_WIDGET_URI },
  "openai/outputTemplate": NEXTBOUND_WIDGET_URI,
  "openai/toolInvocation/invoking": "Loading Nextbound…",
  "openai/toolInvocation/invoked": "Nextbound ready",
};
const toolResult = (structuredContent: Record<string, unknown>) => ({
  content: [{ type: "text", text: JSON.stringify(structuredContent) }],
  structuredContent,
});
const emptySchema = {
  type: "object",
  additionalProperties: false,
  properties: {},
};
const idProp = { type: "string", minLength: 1, maxLength: 100 };
const objectSchema = (
  properties: Record<string, unknown>,
  required: string[] = [],
) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required,
});
const tools: Record<
  string,
  { zodSchema: any; jsonSchema: any; handler: (args: any) => unknown }
> =
  {
    open_seed: {
      zodSchema: proceduralSchemas.open_seed,
      jsonSchema: objectSchema(
        { seedId: idProp, recipientId: idProp },
        ["seedId", "recipientId"],
      ),
      handler: ({ seedId, recipientId }) => nextbound.openSeed(seedId, recipientId),
    },
    get_session_trace: {
      zodSchema: proceduralSchemas.get_session_trace,
      jsonSchema: objectSchema({ sessionId: idProp }, ["sessionId"]),
      handler: ({ sessionId }) => nextbound.getSessionTrace(sessionId),
    },
    list_local_knowledge_profiles: {
      zodSchema: knowledgeSchemas.list_local_knowledge_profiles,
      jsonSchema: emptySchema,
      handler: () => ({
        view: "local_knowledge",
        profiles: listLocalKnowledgeProfiles(),
      }),
    },
    open_local_knowledge_artifact: {
      zodSchema: knowledgeSchemas.open_local_knowledge_artifact,
      jsonSchema: objectSchema({ profileId: idProp, seedId: idProp }),
      handler: ({ profileId = "maya", seedId = "seed-afterlight-maya" }) => {
        const profile = getLocalKnowledgeProfile(profileId);
        if (!profile)
          throw new NextboundError(
            "unknown_profile",
            "That local knowledge profile is not available.",
          );
        return {
          ...nextbound.openSeed(seedId, profile.id),
          view: "local_knowledge_artifact",
          localKnowledge: profile,
          artifact: {
            id: "nextbound-procedural-loop-artifact",
            title: "Nextbound Experience Engine",
            resourceUri: NEXTBOUND_WIDGET_URI,
            surface: "conversation_inline_artifact",
          },
        };
      },
    },
  };

const readBody = (req: any) =>
  new Promise<string>((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const handleRpc = (message: any) => {
  const id = message.id ?? null;
  switch (message.method) {
    case "initialize":
      return result(id, {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: "adaptive-media", version: "0.2.0" },
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return result(id, {
        tools: Object.entries(tools).map(([name, tool]) => ({
          name,
          title: name.replaceAll("_", " "),
          description: `${name} for the local Nextbound artifact.`,
          inputSchema: tool.jsonSchema,
          _meta: toolMeta,
        })),
      });
    case "tools/call": {
      const name = message.params?.name;
      const tool = tools[name];
      if (!tool) return error(id, -32602, `Tool ${name} not found`);
      const parsed = tool.zodSchema.safeParse(message.params?.arguments ?? {});
      if (!parsed.success) return error(id, -32602, parsed.error.message);
      try {
        return result(id, toolResult(tool.handler(parsed.data) as any));
      } catch (err) {
        return result(id, {
          ...toolResult({
            error: {
              code: err instanceof NextboundError ? err.code : "invalid_request",
              message:
                err instanceof Error
                  ? err.message
                  : "The request could not be completed.",
            },
          }),
          isError: true,
        });
      }
    }
    case "resources/list":
      return result(id, {
        resources: [
          {
            uri: NEXTBOUND_WIDGET_URI,
            name: "nextbound-experience-widget",
            title: "Nextbound Experience Engine",
            description: "Deterministic collaborative Nextbound experience",
            mimeType: "text/html;profile=mcp-app",
          },
        ],
      });
    case "resources/read":
      if (message.params?.uri !== NEXTBOUND_WIDGET_URI)
        return error(id, -32602, "Unknown resource");
      return result(id, {
        contents: [
          {
            uri: NEXTBOUND_WIDGET_URI,
            mimeType: "text/html;profile=mcp-app",
            text: readFileSync(
              new URL("../web/nextbound-dist/nextbound.html", import.meta.url),
              "utf8",
            ).replace(
              "<head>",
              "<head><script>window.__NEXTBOUND_MODE__='mcp'</script>",
            ),
            _meta: { ui: { prefersBorder: false } },
          },
        ],
      });
    default:
      return error(id, -32601, "Method not found");
  }
};

const port = Number(process.env.PORT ?? 3000);
createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (url.pathname !== "/mcp") return json(res, { error: "not_found" }, 404);
  if (req.method === "GET") return json(res, { status: "ok" });
  if (req.method !== "POST") return json(res, { error: "method_not_allowed" }, 405);
  try {
    const body = JSON.parse(await readBody(req));
    const messages = Array.isArray(body) ? body : [body];
    const responses = messages.map(handleRpc).filter(Boolean);
    if (!responses.length) {
      res.writeHead(202).end();
      return;
    }
    json(res, Array.isArray(body) ? responses : responses[0]);
  } catch {
    json(res, error(null, -32700, "Parse error"), 400);
  }
}).listen(port, "127.0.0.1", () => {
  console.error(`Adaptive Media MCP server: http://127.0.0.1:${port}/mcp`);
});
