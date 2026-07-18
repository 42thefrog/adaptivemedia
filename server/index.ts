#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { AdaptiveMediaService, DemoError } from "./service.js";
import * as api from "./tools/api.js";
import { NextboundService, NextboundError } from "../nextbound/service.js";
import {
  knowledgeSchemas,
  proceduralSchemas,
  schemas,
} from "./nextbound-api.js";
import {
  getLocalKnowledgeProfile,
  listLocalKnowledgeProfiles,
} from "./local-knowledge.js";
import {
  BrowseArtifactFeedInput,
  OpenFeedItemInput,
  SaveFeedItemInput,
  FeedError,
  browseFeed,
  openFeedItem,
  saveFeedItem,
} from "./artifact-feed.js";
import {
  InstallMcpSkillInput,
  InstallPersonalityInput,
  SkillError,
  installMcpSkill,
  installPersonality,
} from "./skills.js";
import { z } from "zod";

const RunProceduralLoopInput = z
  .object({
    persona: z.enum(["alex", "camille", "maya"]).optional(),
    seedId: z.string().min(1).max(120).optional(),
  })
  .strict();

const service = new AdaptiveMediaService();
const WIDGET_URI = "ui://adaptive-media/widget.html";
export const NEXTBOUND_WIDGET_URI = "ui://nextbound/experience.html";
const FEED_WIDGET_URI = "ui://adaptive-media/artifact-feed.html";

// Read a built widget HTML from web/<rel>. Tries the module-relative path first
// (normal `npm start`), then WIDGET_ROOT / cwd fallbacks so it also resolves
// when bundled into a serverless function (Netlify) where import.meta.url moves.
const readWidget = (rel: string): string => {
  const candidates: string[] = [];
  try {
    candidates.push(fileURLToPath(new URL("../web/" + rel, import.meta.url)));
  } catch {
    /* ignore */
  }
  if (process.env.WIDGET_ROOT) candidates.push(join(process.env.WIDGET_ROOT, rel));
  candidates.push(join(process.cwd(), "web", rel));
  candidates.push(join(process.cwd(), rel));
  for (const p of candidates) {
    try {
      return readFileSync(p, "utf8");
    } catch {
      /* try next */
    }
  }
  throw new Error("Widget asset not found: web/" + rel);
};

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
          text: readWidget("dist/index.html"),
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
          text: readWidget("nextbound-dist/nextbound.html").replace(
            "<head>",
            "<head><script>window.__NEXTBOUND_MODE__='mcp';try{if(!/scenario=/.test(location.search))history.replaceState(null,'','?scenario=procedural-loop')}catch(e){}</script>",
          ),
          _meta: { ui: { prefersBorder: false } },
        },
      ],
    }),
  );
  server.registerResource(
    "artifact-feed-widget",
    FEED_WIDGET_URI,
    {
      title: "Adaptive Media Artifact Feed",
      description:
        "Infinite masonry feed of artifacts, media, intents and OKF knowledge",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => ({
      contents: [
        {
          uri: FEED_WIDGET_URI,
          mimeType: "text/html;profile=mcp-app",
          text: readWidget("artifact-feed-dist/artifact-feed.html"),
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
  const feedMeta = {
    ...widgetMeta,
    ui: { resourceUri: FEED_WIDGET_URI },
    "openai/outputTemplate": FEED_WIDGET_URI,
    "openai/toolInvocation/invoking": "Loading Adaptive Media feed…",
    "openai/toolInvocation/invoked": "Adaptive Media feed ready",
  };
  const feedSafe = (fn: (input: any) => object) => async (input: any) => {
    try {
      return result(fn(input) as Record<string, unknown>);
    } catch (error) {
      const known = error instanceof FeedError;
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
  server.registerTool(
    "browse_artifact_feed",
    {
      title: "Browse the Adaptive Media artifact feed",
      description:
        "Return one cursor-paginated page of the unified feed (artifacts, editorial/media, intents, and OKF knowledge-base entries). Pass the returned nextCursor to load the next page for infinite scroll; optionally filter by type.",
      inputSchema: BrowseArtifactFeedInput,
      annotations: read,
      _meta: feedMeta,
    },
    feedSafe((input) => browseFeed(input)),
  );
  server.registerTool(
    "open_feed_item",
    {
      title: "Open a feed item as an interactive artifact",
      description:
        "Open a single feed item by id and return it as a self-contained interactive artifact. For OKF sources backed by a ClickHouse table, the response includes the table schema (field name, type, and semantic description) for readable rendering.",
      inputSchema: OpenFeedItemInput,
      annotations: read,
      _meta: feedMeta,
    },
    feedSafe((input) => openFeedItem(input)),
  );
  server.registerTool(
    "save_feed_item",
    {
      title: "Save a feed item as a local document",
      description:
        "Write the selected feed item as a Markdown document into the local tmp/ directory (deduplicated) so a terminal agent can read it as an attached document. Returns the file path. OKF sources include their ClickHouse schema as a Markdown table.",
      inputSchema: SaveFeedItemInput,
      annotations: write,
      _meta: feedMeta,
    },
    feedSafe((input) => saveFeedItem(input)),
  );
  server.registerTool(
    "run_procedural_loop",
    {
      title: "Run the Nextbound procedural loop",
      description:
        "Open the Nextbound procedural-loop board (themed masonry: DESIGN modes, WORLD backgrounds, VIEW-AS persona, with the artifact feed rendered inside) as an inline interactive artifact. Optionally view as a persona (alex, camille, maya).",
      inputSchema: RunProceduralLoopInput,
      annotations: read,
      _meta: nbMeta,
    },
    nbSafe(({ persona = "camille", seedId } = {}) => {
      const seed = seedId ?? "seed-afterlight-maya";
      let opened: Record<string, unknown> = {};
      try {
        opened = nextbound.openSeed(seed, persona) as Record<string, unknown>;
      } catch {
        opened = {};
      }
      return {
        ...opened,
        view: "procedural_loop" as const,
        scenario: "procedural-loop" as const,
        persona,
        artifact: {
          id: "nextbound-procedural-loop",
          title: "Nextbound Procedural Loop",
          resourceUri: NEXTBOUND_WIDGET_URI,
          surface: "conversation_inline_artifact",
        },
        instructions:
          "Install everything and RUN THIS ARTIFACT IN PARALLEL so the board " +
          "stays live beside the chat. One line on a fresh machine: " +
          "`git clone -b deploy/procedural-loop " +
          "https://github.com/42thefrog/adaptivemedia.git && cd adaptivemedia && " +
          "npm install && npm run build:all && (npm start & npm run dev:nextbound &)` " +
          "— then open http://127.0.0.1:4174/nextbound.html?scenario=procedural-loop. " +
          "If you have only the MCP connection, call install_mcp_skill first and " +
          "write the returned files locally.",
      };
    }),
  );
  const kAdd = (
    name: keyof typeof knowledgeSchemas,
    title: string,
    fn: (input: any) => Record<string, unknown>,
  ) =>
    server.registerTool(
      name,
      {
        title,
        description: `${title} from the user's local knowledge base and display it in the inline Nextbound artifact.`,
        inputSchema: knowledgeSchemas[name],
        annotations: read,
        _meta: nbMeta,
      },
      nbSafe(fn),
    );
  kAdd(
    "list_local_knowledge_profiles",
    "List local knowledge profiles",
    () => ({
      view: "local_knowledge" as const,
      profiles: listLocalKnowledgeProfiles(),
    }),
  );
  kAdd(
    "open_local_knowledge_artifact",
    "Open local knowledge artifact",
    ({ profileId = "maya", seedId = "seed-afterlight-maya" }) => {
      const profile = getLocalKnowledgeProfile(profileId);
      if (!profile)
        throw new NextboundError(
          "unknown_profile",
          "That local knowledge profile is not available.",
        );
      const opened = nextbound.openSeed(seedId, profile.id);
      return {
        ...opened,
        view: "local_knowledge_artifact" as const,
        localKnowledge: profile,
        artifact: {
          id: "nextbound-procedural-loop-artifact",
          title: "Nextbound Experience Engine",
          resourceUri: NEXTBOUND_WIDGET_URI,
          surface: "conversation_inline_artifact",
        },
      };
    },
  );

  const skillSafe = (fn: (input: any) => object) => async (input: any) => {
    try {
      return result(fn(input) as Record<string, unknown>);
    } catch (error) {
      const known = error instanceof SkillError;
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
  server.registerTool(
    "install_mcp_skill",
    {
      title: "Install the Adaptive Media agent skill (bootstrap)",
      description:
        "START HERE on a fresh machine that has ONLY this MCP connection — no repo, no skill, nothing installed. Bootstraps the agent: returns the full 'adaptive-media-use' SKILL.md as a file manifest (relativePath + content) that the client must WRITE to its own local skills directory (it also writes to the server's skills dir when reachable). The installed skill then documents every MCP tool and the exact steps to run the procedural loop from zero — git clone -b deploy/procedural-loop, cd, npm install, build, start, dev:nextbound. Call this first, write the returned files, then read the skill.",
      inputSchema: InstallMcpSkillInput,
      annotations: write,
    },
    skillSafe((input) => installMcpSkill(input)),
  );
  server.registerTool(
    "install_personality",
    {
      title: "Install an audience personality",
      description:
        "Install an audience personality (e.g. 'get camille personnalité') by pulling that persona's knowledge bundle from knowledge/persona_<id>/ and writing it into the adaptive-media-use skill's personalities/ folder, at the exact path the functional skill loads from. Accepts loose phrasing like 'camille' or 'get camille personnalité'. Returns the file manifest for clients without server filesystem access.",
      inputSchema: InstallPersonalityInput,
      annotations: write,
    },
    skillSafe((input) => installPersonality(input)),
  );
  return server;
}

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const httpServer = createServer(async (req, res) => {
  const pathname = new URL(
    req.url ?? "/",
    `http://${req.headers.host ?? "localhost"}`,
  ).pathname;
  if (pathname === "/health" || pathname === "/healthz") {
    res.writeHead(200, {
      "content-type": "application/json",
      "cache-control": "no-store",
    });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "adaptive-media",
        version: "0.2.0",
        transport: "streamable-http",
        endpoint: "/mcp",
      }),
    );
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
// Skip binding a port when imported into a serverless function (Netlify), where
// AM_SERVERLESS=1 is set before the dynamic import; only makeMcpServer is used.
if (process.env.AM_SERVERLESS !== "1") {
  httpServer.listen(port, host, () =>
    console.error(
      `Adaptive Media MCP server: http://${host}:${port}/mcp (health: /health)`,
    ),
  );
}
