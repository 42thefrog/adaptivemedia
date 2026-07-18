import { z } from "zod";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

/**
 * Unified artifact feed for the ChatGPT MCP App.
 *
 * The feed mixes four content families behind one shape so the masonry widget
 * can render heterogeneous cards from a single paginated stream:
 *   - "artifact"  interactive artifacts
 *   - "editorial" editorial / media content
 *   - "intent"    intentions / creations
 *   - "okf"       knowledge-base entries in the Open Knowledge Format
 *
 * An OKF entry can describe a person, concept, document, source or resource.
 * A "source" of kind `clickhouse_table` carries a schema: every field lists at
 * least a name, a type and a semantic description, which the selected artifact
 * renders as a readable table.
 *
 * Everything here is deterministic: no clocks, no randomness. The same cursor
 * always yields the same page, which keeps the tools idempotent and testable.
 */

export type FeedItemType = "artifact" | "editorial" | "intent" | "okf";
export type OkfKind =
  | "person"
  | "concept"
  | "document"
  | "source"
  | "resource";
export type MediaKind = "gradient" | "image" | "code" | "chart" | "quote";

export interface OkfField {
  name: string;
  type: string;
  description: string;
}

export interface OkfTable {
  engine: "clickhouse";
  database: string;
  table: string;
  rowCountEstimate: number;
  partitionKey?: string;
  orderBy?: string;
  fields: OkfField[];
}

export interface FeedMedia {
  kind: MediaKind;
  /** Aspect ratio (height / width). Drives card height in the masonry layout. */
  ratio: number;
  label?: string;
  accentFrom: string;
  accentTo: string;
}

export interface FeedAuthor {
  name: string;
  role: string;
}

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  summary: string;
  tags: string[];
  media: FeedMedia;
  author?: FeedAuthor;
  metric?: { label: string; value: string };
  okf?: {
    kind: OkfKind;
    subtitle: string;
    body: string;
    relations: string[];
    table?: OkfTable;
  };
  /** Sortable deterministic key (higher = newer). */
  order: number;
}

export interface FeedPage {
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface FeedItemDetail extends FeedItem {
  /** Longer narrative shown when the item is opened as its own artifact. */
  detail: {
    heading: string;
    paragraphs: string[];
    highlights: string[];
    /** Present for OKF sources: the ClickHouse table rendered as a data table. */
    table?: OkfTable;
    followUpPrompt: string;
  };
}

export class FeedError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "FeedError";
  }
}

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 24;
const CURSOR_PREFIX = "feed:";

// --- Deterministic dataset -------------------------------------------------

const gradients: [string, string][] = [
  ["#6366f1", "#0ea5e9"],
  ["#f472b6", "#8b5cf6"],
  ["#10b981", "#0ea5e9"],
  ["#f59e0b", "#ef4444"],
  ["#14b8a6", "#6366f1"],
  ["#a855f7", "#ec4899"],
  ["#0ea5e9", "#22d3ee"],
  ["#f97316", "#eab308"],
];

const clickhouseTables: OkfTable[] = [
  {
    engine: "clickhouse",
    database: "adaptive_media",
    table: "creator_intents",
    rowCountEstimate: 128_540,
    partitionKey: "toYYYYMM(published_at)",
    orderBy: "(creator_id, published_at)",
    fields: [
      {
        name: "intent_id",
        type: "String",
        description: "Stable identifier of a published creator Intent.",
      },
      {
        name: "creator_id",
        type: "String",
        description: "Author of the Intent; joins to okf.people.",
      },
      {
        name: "title",
        type: "String",
        description: "Human-readable Intent title as published.",
      },
      {
        name: "goal",
        type: "String",
        description: "The outcome the creator wants the audience to reach.",
      },
      {
        name: "archetypes",
        type: "Array(LowCardinality(String))",
        description: "Brand archetypes that shape the Intent's voice.",
      },
      {
        name: "published_at",
        type: "DateTime64(3, 'UTC')",
        description: "Publication timestamp used for recency ranking.",
      },
      {
        name: "engagement_score",
        type: "Float32",
        description: "Deterministic 0-1 resonance score across personas.",
      },
    ],
  },
  {
    engine: "clickhouse",
    database: "adaptive_media",
    table: "experience_events",
    rowCountEstimate: 4_812_003,
    partitionKey: "toDate(event_time)",
    orderBy: "(session_id, event_time)",
    fields: [
      {
        name: "event_id",
        type: "UUID",
        description: "Unique identifier for a single interaction event.",
      },
      {
        name: "session_id",
        type: "String",
        description: "Experience session the event belongs to.",
      },
      {
        name: "persona_id",
        type: "LowCardinality(String)",
        description: "Audience persona: alex, camille or maya.",
      },
      {
        name: "action",
        type: "LowCardinality(String)",
        description: "Interaction verb, e.g. open, like, save, share.",
      },
      {
        name: "artifact_id",
        type: "String",
        description: "Artifact the interaction resolved into, if any.",
      },
      {
        name: "event_time",
        type: "DateTime64(3, 'UTC')",
        description: "Server-side event time in UTC.",
      },
      {
        name: "dwell_ms",
        type: "UInt32",
        description: "Milliseconds of attention attributed to the event.",
      },
    ],
  },
  {
    engine: "clickhouse",
    database: "okf",
    table: "knowledge_nodes",
    rowCountEstimate: 62_190,
    partitionKey: "kind",
    orderBy: "(kind, node_id)",
    fields: [
      {
        name: "node_id",
        type: "String",
        description: "Primary key of an OKF knowledge node.",
      },
      {
        name: "kind",
        type: "Enum8('person','concept','document','source','resource')",
        description: "Ontological class of the knowledge node.",
      },
      {
        name: "label",
        type: "String",
        description: "Display label for the node.",
      },
      {
        name: "summary",
        type: "String",
        description: "One-paragraph semantic summary of the node.",
      },
      {
        name: "relations",
        type: "Array(String)",
        description: "Outgoing edges to other node_id values.",
      },
      {
        name: "embedding",
        type: "Array(Float32)",
        description: "1024-d semantic embedding for similarity search.",
      },
    ],
  },
];

interface Seed {
  type: FeedItemType;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  media: MediaKind;
  ratio: number;
  author?: FeedAuthor;
  metric?: { label: string; value: string };
  okf?: {
    kind: OkfKind;
    subtitle: string;
    body: string;
    relations: string[];
    tableIndex?: number;
  };
}

const seeds: Seed[] = [
  {
    type: "artifact",
    slug: "living-artifact",
    title: "Living Artifact — Journey 04",
    summary:
      "A generative form that evolves with every meaningful interaction. Choose an identity and watch the geometry respond.",
    tags: ["interactive", "three.js", "generative"],
    media: "gradient",
    ratio: 1.15,
    author: { name: "Nextbound Studio", role: "Experience engine" },
    metric: { label: "Evolution", value: "Stage III" },
  },
  {
    type: "editorial",
    slug: "attention-economy",
    title: "The attention economy is a design problem",
    summary:
      "Why adaptive media has to earn attention through resonance rather than extraction — a short field note.",
    tags: ["essay", "media", "design"],
    media: "quote",
    ratio: 0.7,
    author: { name: "Camille Roy", role: "Editorial" },
  },
  {
    type: "intent",
    slug: "aurora-sessions",
    title: "Aurora Sessions",
    summary:
      "An Intent to turn late-night studio recordings into a personalized listening ritual for each fan.",
    tags: ["music", "creation", "ritual"],
    media: "gradient",
    ratio: 1.35,
    author: { name: "Luna Vale", role: "Creator" },
    metric: { label: "Resonance", value: "0.86" },
  },
  {
    type: "okf",
    slug: "clickhouse-creator-intents",
    title: "Source · creator_intents",
    summary:
      "ClickHouse table backing published creator Intents. Semantic schema attached.",
    tags: ["okf", "source", "clickhouse"],
    media: "chart",
    ratio: 0.9,
    okf: {
      kind: "source",
      subtitle: "adaptive_media.creator_intents",
      body: "Primary fact table for published Intents. Each row is one Intent version with its goal, archetypes and recency-ranked publication time.",
      relations: ["person:luna-vale", "concept:intent-graph"],
      tableIndex: 0,
    },
  },
  {
    type: "artifact",
    slug: "resonance-field",
    title: "Shared Resonance Field",
    summary:
      "A collaborative particle field where two visitors shape the same artifact in real time.",
    tags: ["interactive", "multiplayer", "webgl"],
    media: "gradient",
    ratio: 1.0,
    author: { name: "Nextbound Studio", role: "Experience engine" },
  },
  {
    type: "okf",
    slug: "person-luna-vale",
    title: "Person · Luna Vale",
    summary:
      "Creator archetype node. Sage/Magician voice, ambient electronic practice.",
    tags: ["okf", "person", "creator"],
    media: "gradient",
    ratio: 0.75,
    okf: {
      kind: "person",
      subtitle: "okf:person/luna-vale",
      body: "Independent creator working at the edge of ambient electronic music and generative visuals. Voice blends Sage clarity with Magician transformation.",
      relations: ["source:creator_intents", "concept:adaptive-media"],
    },
  },
  {
    type: "editorial",
    slug: "okf-primer",
    title: "A primer on the Open Knowledge Format",
    summary:
      "How OKF models people, concepts, documents, sources and resources as one navigable graph.",
    tags: ["okf", "explainer", "knowledge"],
    media: "code",
    ratio: 1.1,
    author: { name: "Adaptive Media", role: "Docs" },
  },
  {
    type: "okf",
    slug: "clickhouse-experience-events",
    title: "Source · experience_events",
    summary:
      "High-volume interaction event stream. 4.8M rows, partitioned by day.",
    tags: ["okf", "source", "clickhouse", "events"],
    media: "chart",
    ratio: 1.2,
    okf: {
      kind: "source",
      subtitle: "adaptive_media.experience_events",
      body: "Append-only event log of every meaningful interaction inside an experience session. Feeds deterministic resonance scoring.",
      relations: ["concept:resonance", "source:creator_intents"],
      tableIndex: 1,
    },
  },
  {
    type: "intent",
    slug: "field-notes",
    title: "Field Notes → Zine",
    summary:
      "An Intent that composes a reader's saved insights into a personal printable zine.",
    tags: ["publishing", "creation", "personal"],
    media: "quote",
    ratio: 0.8,
    author: { name: "Camille Roy", role: "Creator" },
    metric: { label: "Saved", value: "1.2k" },
  },
  {
    type: "artifact",
    slug: "soundtrack-weave",
    title: "Soundtrack Weave",
    summary:
      "Layer stems into an adaptive soundtrack that follows the mood of the reader's session.",
    tags: ["audio", "interactive", "adaptive"],
    media: "gradient",
    ratio: 0.95,
    author: { name: "Elias Nord", role: "Sound" },
  },
  {
    type: "okf",
    slug: "concept-intent-graph",
    title: "Concept · Intent Graph",
    summary:
      "The directed graph connecting Intents, artifacts and the tools that resolve them.",
    tags: ["okf", "concept", "graph"],
    media: "code",
    ratio: 0.85,
    okf: {
      kind: "concept",
      subtitle: "okf:concept/intent-graph",
      body: "A concept node describing how one Intent resolves into many artifacts through deterministic next-action edges, preserving attribution at each hop.",
      relations: ["source:creator_intents", "document:okf-spec"],
    },
  },
  {
    type: "okf",
    slug: "clickhouse-knowledge-nodes",
    title: "Source · knowledge_nodes",
    summary:
      "The OKF graph itself, materialized as a ClickHouse table with embeddings.",
    tags: ["okf", "source", "clickhouse", "graph"],
    media: "chart",
    ratio: 1.05,
    okf: {
      kind: "source",
      subtitle: "okf.knowledge_nodes",
      body: "Every OKF node — person, concept, document, source, resource — stored with a semantic summary, outgoing relations and a similarity embedding.",
      relations: ["concept:intent-graph", "document:okf-spec"],
      tableIndex: 2,
    },
  },
  {
    type: "editorial",
    slug: "deterministic-demos",
    title: "Why our demos are deterministic",
    summary:
      "No live model in the loop: every experience replays identically so it can be inspected and trusted.",
    tags: ["engineering", "trust", "media"],
    media: "quote",
    ratio: 0.65,
    author: { name: "Adaptive Media", role: "Editorial" },
  },
  {
    type: "okf",
    slug: "okf-spec",
    title: "Document · OKF Spec v0.3",
    summary:
      "The working specification for the Open Knowledge Format graph model.",
    tags: ["okf", "document", "spec"],
    media: "code",
    ratio: 1.25,
    okf: {
      kind: "document",
      subtitle: "okf:document/okf-spec",
      body: "Living specification defining node kinds, edge semantics and the mapping from OKF nodes onto physical sources such as ClickHouse tables.",
      relations: ["concept:intent-graph", "source:knowledge_nodes"],
    },
  },
  {
    type: "artifact",
    slug: "memory-mosaic",
    title: "Memory Mosaic",
    summary:
      "A visual memory that reassembles a reader's journey into a single cinematic frame.",
    tags: ["interactive", "memory", "visual"],
    media: "gradient",
    ratio: 1.4,
    author: { name: "Maya Okonkwo", role: "Creator" },
  },
  {
    type: "okf",
    slug: "resource-kit",
    title: "Resource · Starter Kit",
    summary:
      "A curated OKF resource bundle for creators shipping their first adaptive experience.",
    tags: ["okf", "resource", "starter"],
    media: "code",
    ratio: 0.9,
    okf: {
      kind: "resource",
      subtitle: "okf:resource/starter-kit",
      body: "A resource node bundling templates, example Intents and the deterministic runtime so a creator can ship an adaptive experience in an afternoon.",
      relations: ["document:okf-spec", "concept:adaptive-media"],
    },
  },
  // --- External / creative content (added from outside the OKF knowledge base:
  // playable media, audio/video previews, moodboards, generated images, memory
  // places, consumable warps, cross-widget quests, living canvas, stories). ---
  {
    type: "artifact",
    slug: "trace-catcher",
    title: "Afterlight Arcade · 01 — Trace Catcher",
    summary:
      "Playable media: touch the light before it crosses into the next artifact. Every hit transforms the surrounding feed.",
    tags: ["game", "playable", "arcade"],
    media: "gradient",
    ratio: 1.3,
    author: { name: "Afterlight Arcade", role: "Playable media" },
    metric: { label: "Level", value: "01 · catch 3" },
  },
  {
    type: "editorial",
    slug: "soundcloud-camille",
    title: "SoundCloud preview · @camille",
    summary:
      "Audio media pulled into the feed — moodboards, audio, media for Camille's curated night in.",
    tags: ["audio", "soundcloud", "media"],
    media: "quote",
    ratio: 0.7,
    author: { name: "Camille", role: "Audio" },
  },
  {
    type: "editorial",
    slug: "youtube-afterlight",
    title: "YouTube preview · Afterlight",
    summary:
      "Video media embedded in the stream; watch, then discuss it with ChatGPT.",
    tags: ["video", "youtube", "media"],
    media: "gradient",
    ratio: 0.9,
    author: { name: "Video", role: "Media" },
  },
  {
    type: "editorial",
    slug: "moodboard-studio-wall",
    title: "Moodboard · Studio Wall",
    summary:
      "Tap-to-pin moodboard: pinned studio references — objects, swatches and silhouettes.",
    tags: ["moodboard", "visual", "pins"],
    media: "image",
    ratio: 1.1,
    author: { name: "Camille", role: "Moodboard" },
  },
  {
    type: "artifact",
    slug: "generated-afterlight-04",
    title: "Generated image · Afterlight 04",
    summary: "A memory reorganized as weather. Save the image or reshape it.",
    tags: ["generated", "image", "memory"],
    media: "gradient",
    ratio: 1.0,
    author: { name: "Afterlight", role: "Generated" },
  },
  {
    type: "intent",
    slug: "paris-pont-des-arts",
    title: "Paris · Pont des Arts",
    summary:
      "A place where objects become promises. A memory location woven into the experience.",
    tags: ["memory", "place", "paris"],
    media: "quote",
    ratio: 1.2,
    author: { name: "Memory", role: "Place" },
    metric: { label: "Where", value: "Paris" },
  },
  {
    type: "artifact",
    slug: "warp-one-use",
    title: "Warp · one use",
    summary:
      "Consumable window into source space — open a temporary passage between artifacts.",
    tags: ["warp", "consumable", "portal"],
    media: "code",
    ratio: 0.7,
    author: { name: "Source space", role: "Consumable" },
    metric: { label: "Uses", value: "1" },
  },
  {
    type: "intent",
    slug: "cross-widget-quest",
    title: "Cross-widget quest — meet on the bridge",
    summary:
      "Win the lock, meet on the bridge, attach together. A collaborative quest across two widgets.",
    tags: ["quest", "multiplayer", "collab"],
    media: "gradient",
    ratio: 0.9,
    author: { name: "Cross-widget", role: "Quest" },
    metric: { label: "Players", value: "2 required" },
  },
  {
    type: "artifact",
    slug: "living-canvas-noa",
    title: "Living Canvas · Noa",
    summary:
      "A shared living canvas: Noa releases a precise line into the field and it keeps growing.",
    tags: ["canvas", "collaborative", "generative"],
    media: "gradient",
    ratio: 1.15,
    author: { name: "Noa", role: "Living Canvas" },
  },
  {
    type: "editorial",
    slug: "story-the-trace-arrives",
    title: "Story · The trace arrives",
    summary:
      "Living Canvas narrative: Maya releases a precise line into the shared field.",
    tags: ["story", "narrative", "canvas"],
    media: "quote",
    ratio: 0.65,
    author: { name: "Story", role: "Living Canvas" },
  },
];

function buildItem(seed: Seed, order: number, cycle: number): FeedItem {
  const gradient = gradients[order % gradients.length];
  const id = cycle === 0 ? seed.slug : `${seed.slug}-${cycle + 1}`;
  const okf = seed.okf
    ? {
        kind: seed.okf.kind,
        subtitle: seed.okf.subtitle,
        body: seed.okf.body,
        relations: seed.okf.relations,
        table:
          seed.okf.tableIndex !== undefined
            ? clickhouseTables[seed.okf.tableIndex]
            : undefined,
      }
    : undefined;
  return {
    id,
    type: seed.type,
    title: cycle === 0 ? seed.title : `${seed.title} · ${cycle + 1}`,
    summary: seed.summary,
    tags: seed.tags,
    media: {
      kind: seed.media,
      ratio: seed.ratio,
      label: seed.media === "chart" ? "ClickHouse" : undefined,
      accentFrom: gradient[0],
      accentTo: gradient[1],
    },
    author: seed.author,
    metric: seed.metric,
    okf,
    order,
  };
}

/** Total number of synthetic items; large enough to exercise infinite scroll. */
const TOTAL_CYCLES = 4;

const dataset: FeedItem[] = (() => {
  const items: FeedItem[] = [];
  let order = seeds.length * TOTAL_CYCLES;
  for (let cycle = 0; cycle < TOTAL_CYCLES; cycle += 1) {
    for (const seed of seeds) {
      items.push(buildItem(seed, order, cycle));
      order -= 1;
    }
  }
  return items;
})();

const byId = new Map(dataset.map((item) => [item.id, item]));

// --- Cursor helpers --------------------------------------------------------

function encodeCursor(offset: number): string {
  return Buffer.from(`${CURSOR_PREFIX}${offset}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): number {
  let decoded: string;
  try {
    decoded = Buffer.from(cursor, "base64url").toString("utf8");
  } catch {
    throw new FeedError("invalid_cursor", "The feed cursor is malformed.");
  }
  if (!decoded.startsWith(CURSOR_PREFIX)) {
    throw new FeedError("invalid_cursor", "The feed cursor is malformed.");
  }
  const offset = Number(decoded.slice(CURSOR_PREFIX.length));
  if (!Number.isInteger(offset) || offset < 0) {
    throw new FeedError("invalid_cursor", "The feed cursor is malformed.");
  }
  return offset;
}

// --- Public schemas & service ---------------------------------------------

const FeedTypeSchema = z.enum(["artifact", "editorial", "intent", "okf"]);

export const BrowseArtifactFeedInput = z
  .object({
    cursor: z.string().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
    type: FeedTypeSchema.optional(),
    persona: z.enum(["alex", "camille", "maya"]).optional(),
  })
  .strict();

export const OpenFeedItemInput = z
  .object({ itemId: z.string().min(1).max(120) })
  .strict();

export type BrowseArtifactFeedArgs = z.infer<typeof BrowseArtifactFeedInput>;
export type OpenFeedItemArgs = z.infer<typeof OpenFeedItemInput>;

type Persona = "alex" | "camille" | "maya";

/**
 * Deterministic persona ranking score. Pure function of (item, persona): no
 * clocks, no randomness, so the "same cursor + same persona → same page"
 * invariant holds. Ranking (not filtering) preserves `total` and infinite
 * scroll depth. The client resets the cursor on persona switch, so a cursor
 * is never carried across personas.
 */
function personaScore(item: FeedItem, persona: Persona): number {
  const k = item.okf?.kind;
  const m = item.media.kind;
  const t = item.type;
  const isSource = k === "source" || Boolean(item.okf?.table);
  if (persona === "alex")
    return (
      (isSource ? 40 : 0) +
      (t === "okf" ? 20 : 0) +
      (t === "intent" ? 10 : 0) +
      (m === "code" || m === "chart" ? 6 : 0)
    );
  if (persona === "camille")
    return (
      (t === "editorial" ? 40 : 0) +
      (t === "artifact" ? 24 : 0) +
      (k === "concept" ? 12 : 0) +
      (m === "quote" ? 6 : 0)
    );
  // maya
  return (
    (t === "artifact" ? 36 : 0) +
    (isSource ? 24 : 0) +
    (t === "intent" ? 8 : 0) +
    (m === "gradient" || m === "image" ? 6 : 0)
  );
}

export function browseFeed(args: BrowseArtifactFeedArgs = {}): FeedPage {
  const limit = args.limit ?? DEFAULT_LIMIT;
  const base = args.type
    ? dataset.filter((item) => item.type === args.type)
    : dataset;
  // Stable sort: score desc, then original dataset index asc (deterministic
  // tie-break). Without a persona the order is identical to `base`.
  const persona = args.persona as Persona | undefined;
  const filtered = persona
    ? base
        .map((item, index) => ({
          item,
          index,
          score: personaScore(item, persona),
        }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map((r) => r.item)
    : base;
  const offset = args.cursor ? decodeCursor(args.cursor) : 0;
  if (offset > filtered.length) {
    throw new FeedError("invalid_cursor", "The feed cursor is out of range.");
  }
  const items = filtered.slice(offset, offset + limit);
  const nextOffset = offset + items.length;
  const hasMore = nextOffset < filtered.length;
  return {
    items,
    nextCursor: hasMore ? encodeCursor(nextOffset) : null,
    hasMore,
    total: filtered.length,
  };
}

function detailFor(item: FeedItem): FeedItemDetail {
  const highlights: string[] = [];
  if (item.author) highlights.push(`${item.author.role}: ${item.author.name}`);
  if (item.metric) highlights.push(`${item.metric.label}: ${item.metric.value}`);
  highlights.push(`Tags: ${item.tags.join(", ")}`);

  const paragraphs = [item.summary];
  if (item.okf) {
    paragraphs.push(item.okf.body);
    if (item.okf.relations.length) {
      paragraphs.push(`Related nodes: ${item.okf.relations.join(", ")}.`);
    }
  } else {
    paragraphs.push(
      `Selecting this ${item.type} opened it as its own interactive artifact beneath the feed, preserving the original attribution.`,
    );
  }

  return {
    ...item,
    detail: {
      heading: item.title,
      paragraphs,
      highlights,
      table: item.okf?.table,
      followUpPrompt: `Open the feed item "${item.title}" as an interactive artifact.`,
    },
  };
}

export function openFeedItem(args: OpenFeedItemArgs): {
  selectedItem: FeedItemDetail;
} {
  const item = byId.get(args.itemId);
  if (!item) {
    throw new FeedError("not_found", `No feed item with id "${args.itemId}".`);
  }
  return { selectedItem: detailFor(item) };
}

// --- Save a feed item as a local document ---------------------------------

export const SaveFeedItemInput = z
  .object({ itemId: z.string().min(1).max(120) })
  .strict();
export type SaveFeedItemArgs = z.infer<typeof SaveFeedItemInput>;

export interface SaveFeedItemResult {
  itemId: string;
  fileName: string;
  path: string;
  bytes: number;
  deduped: boolean;
}

/** Render a feed item as a self-contained Markdown document. */
export function renderFeedItemMarkdown(item: FeedItem): string {
  const lines: string[] = [];
  lines.push(`# ${item.title}`, "");
  lines.push(
    `**Type:** ${item.type}${item.okf ? ` · ${item.okf.kind}` : ""}`,
  );
  if (item.author) {
    lines.push(`**By:** ${item.author.name} · ${item.author.role}`);
  }
  if (item.metric) lines.push(`**${item.metric.label}:** ${item.metric.value}`);
  lines.push(`**Feed id:** \`${item.id}\``, "");
  lines.push(item.summary, "");
  if (item.okf?.body) lines.push(item.okf.body, "");
  if (item.okf?.relations?.length) {
    lines.push(`**Related nodes:** ${item.okf.relations.join(", ")}`, "");
  }
  lines.push(`**Tags:** ${item.tags.map((t) => `#${t}`).join(" ")}`, "");
  const table = item.okf?.table;
  if (table) {
    lines.push(`## Schema — ${table.database}.${table.table} (${table.engine})`);
    const meta = [`~${table.rowCountEstimate.toLocaleString()} rows`];
    if (table.orderBy) meta.push(`ORDER BY ${table.orderBy}`);
    if (table.partitionKey) meta.push(`PARTITION ${table.partitionKey}`);
    lines.push(meta.join(" · "), "");
    lines.push("| Field | Type | Semantic description |");
    lines.push("| --- | --- | --- |");
    for (const f of table.fields) {
      lines.push(`| ${f.name} | \`${f.type}\` | ${f.description} |`);
    }
    lines.push("");
  }
  lines.push("_Source: Adaptive Media artifact feed_", "");
  return lines.join("\n");
}

/**
 * Write the selected feed item as a Markdown file into a local directory
 * (default `tmp/` under the process working directory) so a terminal agent
 * (Codex, Claude Code) can pick it up as a document. Deduplicated: if the file
 * already exists with identical content, it is left untouched and `deduped` is
 * true. The filename is derived from the canonical, validated item id, so no
 * caller-controlled path traversal is possible.
 */
export function saveFeedItem(
  args: SaveFeedItemArgs,
  dir: string = join(process.cwd(), "tmp"),
): SaveFeedItemResult {
  const item = byId.get(args.itemId);
  if (!item) {
    throw new FeedError("not_found", `No feed item with id "${args.itemId}".`);
  }
  const content = renderFeedItemMarkdown(item);
  const fileName = `${item.id}.md`;
  const path = join(dir, fileName);
  mkdirSync(dir, { recursive: true });
  let deduped = false;
  if (existsSync(path) && readFileSync(path, "utf8") === content) {
    deduped = true;
  } else {
    writeFileSync(path, content, "utf8");
  }
  return {
    itemId: item.id,
    fileName,
    path,
    bytes: Buffer.byteLength(content, "utf8"),
    deduped,
  };
}

/** Exposed for tests. */
export const __feedInternals = { dataset, byId, encodeCursor, decodeCursor };
