#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { AdaptiveMediaService, DemoError } from "./service.js";
import * as api from "./tools/api.js";
import { NextboundService, NextboundError } from "../nextbound/service.js";
import { proceduralSchemas, schemas } from "./nextbound-api.js";

const service = new AdaptiveMediaService();
const WIDGET_URI = "ui://adaptive-media/widget.html";
export const NEXTBOUND_WIDGET_URI = "ui://nextbound/experience.html";
const widgetMeta = {
  ui: { resourceUri: WIDGET_URI },
  "openai/outputTemplate": WIDGET_URI,
  "openai/toolInvocation/invoking": "Loading Adaptive Media…",
  "openai/toolInvocation/invoked": "Adaptive Media ready",
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
      const known = error instanceof DemoError;
      const body = {
        error: {
          code: known ? error.code : "invalid_request",
          message: known
            ? error.message
            : "The request could not be completed.",
        },
      };
      return { ...result(body), isError: true };
    }
  };

const nextboundDemoStore = new NextboundService();
export function makeMcpServer(nextbound = nextboundDemoStore) {
  const server = new McpServer({ name: "adaptive-media", version: "0.2.0" });
  server.registerResource(
    "adaptive-media-widget",
    WIDGET_URI,
    {
      title: "Adaptive Media",
      description:
        "Creator discovery and deterministic personalized experiences",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: "text/html;profile=mcp-app",
          text: readFileSync(
            new URL("../web/dist/index.html", import.meta.url),
            "utf8",
          ),
          _meta: { ui: { prefersBorder: false } },
        },
      ],
    }),
  );
  server.registerResource(
    "nextbound-experience-widget",
    NEXTBOUND_WIDGET_URI,
    {
      title: "Nextbound Experience Engine",
      description: "Deterministic collaborative Nextbound experience",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => ({
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
    }),
  );
  const read = {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  };
  const write = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };
  server.registerTool(
    "search_public_intents",
    {
      title: "Search public creator Intents",
      description:
        "Search published public creator Intents by creator, category, topic, tags, or desired outcome.",
      inputSchema: api.SearchPublicIntentsInput,
      annotations: read,
      _meta: widgetMeta,
    },
    safe((input) => service.searchPublicIntents(input)),
  );
  server.registerTool(
    "get_creator_profile",
    {
      title: "Open creator profile",
      description:
        "Open a public creator profile and its published public Intents.",
      inputSchema: api.GetCreatorProfileInput,
      annotations: read,
      _meta: widgetMeta,
    },
    safe(({ creatorId }) => service.getCreatorProfile(creatorId)),
  );
  server.registerTool(
    "get_intent",
    {
      title: "Open creator Intent",
      description:
        "Open the original published public Intent before personalization.",
      inputSchema: api.GetIntentInput,
      annotations: read,
      _meta: widgetMeta,
    },
    safe(({ intentId }) => service.getIntent(intentId)),
  );
  server.registerTool(
    "generate_experience",
    {
      title: "Generate deterministic experience",
      description:
        "Return the seeded personalized experience for Alex, Camille, or Maya; no live model is used.",
      inputSchema: api.GenerateExperienceInput,
      annotations: read,
      _meta: widgetMeta,
    },
    safe(({ intentId, personaId }) =>
      service.generateExperience(intentId, personaId),
    ),
  );
  server.registerTool(
    "like_intent",
    {
      title: "Like Intent (local demo)",
      description:
        "Set or clear a local demo like; this does not update a production account.",
      inputSchema: api.LikeIntentInput,
      annotations: write,
      _meta: widgetMeta,
    },
    safe(({ intentId, liked }) => service.likeIntent(intentId, liked)),
  );
  server.registerTool(
    "follow_creator",
    {
      title: "Follow creator (local demo)",
      description:
        "Set or clear a local demo follow; this does not update a production account.",
      inputSchema: api.FollowCreatorInput,
      annotations: write,
      _meta: widgetMeta,
    },
    safe(({ creatorId, following }) =>
      service.followCreator(creatorId, following),
    ),
  );
  server.registerTool(
    "save_experience",
    {
      title: "Save experience (local demo)",
      description: "Set or clear a locally saved deterministic experience.",
      inputSchema: api.SaveExperienceInput,
      annotations: write,
      _meta: widgetMeta,
    },
    safe(({ experienceId, saved }) =>
      service.saveExperience(experienceId, saved),
    ),
  );
  server.registerTool(
    "create_share_link",
    {
      title: "Create demo share reference",
      description:
        "Create a stable local demo share ID with creator and original Intent attribution; no public URL is claimed.",
      inputSchema: api.CreateShareLinkInput,
      annotations: write,
      _meta: widgetMeta,
    },
    safe(({ experienceId }) => service.createShareLink(experienceId)),
  );
  const nbMeta = {
    ...widgetMeta,
    ui: { resourceUri: NEXTBOUND_WIDGET_URI },
    "openai/outputTemplate": NEXTBOUND_WIDGET_URI,
  };
  const nbSafe =
    (fn: (input: any) => Record<string, unknown>) => async (input: any) => {
      try {
        return result(fn(input));
      } catch (error) {
        const known = error instanceof NextboundError;
        return {
          ...result({
            error: {
              code: known ? error.code : "invalid_request",
              message: known
                ? error.message
                : "The request could not be completed.",
            },
          }),
          isError: true,
        };
      }
    };
  const add = (
    name: keyof typeof schemas,
    title: string,
    fn: (input: any) => Record<string, unknown>,
  ) =>
    server.registerTool(
      name,
      {
        title,
        description: `${title} in the deterministic local Nextbound demo.`,
        inputSchema: schemas[name],
        annotations: write,
        _meta: nbMeta,
      },
      nbSafe(fn),
    );
  add("publish_intent", "Publish Intent", ({ intentId }) =>
    nextbound.publishIntent(intentId),
  );
  add(
    "deliver_to_inbox",
    "Deliver Intent to inbox",
    ({ intentId, profileIds }) =>
      nextbound.deliverToInbox(intentId, profileIds),
  );
  add(
    "resolve_okf_context",
    "Resolve authorized OKF context",
    ({ intentId, profileId }) =>
      nextbound.resolveOkfContext(intentId, profileId),
  );
  add(
    "compile_experience",
    "Compile Nextbound experience",
    ({ intentId, profileId }) =>
      nextbound.compileExperience(intentId, profileId),
  );
  add(
    "resolve_next_action",
    "Resolve selected next action",
    ({ sessionId, actionId }) =>
      nextbound.resolveNextAction(sessionId, actionId),
  );
  add("match_tool", "Match registered tool", ({ requiredCapability }) =>
    nextbound.matchTool(requiredCapability),
  );
  add("connect_artifact", "Connect compatible artifact", (x) =>
    nextbound.connectArtifact(
      x.sessionId,
      x.sourceArtifactId,
      x.targetArtifactId,
      x.triggerActionId,
    ),
  );
  add("get_experience_session", "Get experience session", ({ sessionId }) =>
    nextbound.getExperienceSession(sessionId),
  );
  add("pause_experience", "Pause experience", ({ sessionId }) =>
    nextbound.pause(sessionId),
  );
  add("resume_experience", "Resume experience", ({ sessionId }) =>
    nextbound.resume(sessionId),
  );
  add("stop_experience", "Stop experience", ({ sessionId }) =>
    nextbound.stop(sessionId),
  );
  add("restart_experience", "Restart experience", ({ sessionId }) =>
    nextbound.restart(sessionId),
  );
  add("share_experience", "Share local demo experience", ({ sessionId }) =>
    nextbound.share(sessionId),
  );
  const pAdd = (
    name: keyof typeof proceduralSchemas,
    title: string,
    fn: (input: any) => Record<string, unknown>,
  ) =>
    server.registerTool(
      name,
      {
        title,
        description: `${title} in the deterministic continuous procedural runtime.`,
        inputSchema: proceduralSchemas[name],
        annotations: write,
        _meta: nbMeta,
      },
      nbSafe(fn),
    );
  pAdd("open_seed", "Open Campaign Seed", ({ seedId, recipientId }) =>
    nextbound.openSeed(seedId, recipientId),
  );
  pAdd(
    "execute_artifact_contract",
    "Execute ArtifactContract",
    ({ sessionId, contractId }) =>
      nextbound.executeArtifactContract(sessionId, contractId),
  );
  pAdd("process_interaction", "Process meaningful interaction", (input) =>
    nextbound.processInteraction(input),
  );
  pAdd("resolve_nextbounds", "Resolve semantic Nextbounds", ({ sessionId }) =>
    nextbound.resolveProceduralNextbounds(sessionId),
  );
  pAdd("get_artifact_execution", "Get ArtifactExecution", ({ executionId }) =>
    nextbound.getArtifactExecution(executionId),
  );
  pAdd("get_session_trace", "Get procedural session trace", ({ sessionId }) =>
    nextbound.getSessionTrace(sessionId),
  );
  pAdd(
    "replay_session",
    "Replay deterministic session",
    ({ seedId, recipientId, sessionId }) =>
      nextbound.replayProceduralSession(seedId, recipientId, sessionId),
  );
  return server;
}

const port = Number(process.env.PORT ?? 3000);
const httpServer = createServer(async (req, res) => {
  if (
    new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`)
      .pathname !== "/mcp"
  ) {
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
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch {
    if (!res.headersSent)
      res.writeHead(500, { "content-type": "application/json" });
    if (!res.writableEnded)
      res.end(JSON.stringify({ error: "mcp_request_failed" }));
  }
});
httpServer.listen(port, "127.0.0.1", () =>
  console.error(`Adaptive Media MCP server: http://127.0.0.1:${port}/mcp`),
);
