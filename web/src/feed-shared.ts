// Shared feed types + a browser-safe local fallback for the Nextbound feed.
//
// Types mirror server/artifact-feed.ts (the single runtime source of truth),
// exactly as web/src/artifact-feed.tsx already does. localBrowse is ported
// verbatim from artifact-feed.tsx (React-free, numeric-string cursors, no
// Node Buffer) so the Alpine app can render the feed without ChatGPT.

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
  ratio: number;
  label?: string;
  accentFrom: string;
  accentTo: string;
}
export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  summary: string;
  tags: string[];
  media: FeedMedia;
  author?: { name: string; role: string };
  metric?: { label: string; value: string };
  okf?: {
    kind: OkfKind;
    subtitle: string;
    body: string;
    relations: string[];
    table?: OkfTable;
  };
  order: number;
}
export interface FeedPage {
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

// --- Local preview fallback ------------------------------------------------
// Ported verbatim from web/src/artifact-feed.tsx: numeric cursor, no Buffer.

const localGradients: [string, string][] = [
  ["#6366f1", "#0ea5e9"],
  ["#f472b6", "#8b5cf6"],
  ["#10b981", "#0ea5e9"],
  ["#f59e0b", "#ef4444"],
  ["#14b8a6", "#6366f1"],
  ["#a855f7", "#ec4899"],
];
const localSampleTable: OkfTable = {
  engine: "clickhouse",
  database: "adaptive_media",
  table: "creator_intents",
  rowCountEstimate: 128540,
  partitionKey: "toYYYYMM(published_at)",
  orderBy: "(creator_id, published_at)",
  fields: [
    { name: "intent_id", type: "String", description: "Stable Intent id." },
    { name: "creator_id", type: "String", description: "Author of the Intent." },
    { name: "title", type: "String", description: "Published Intent title." },
    { name: "goal", type: "String", description: "Desired audience outcome." },
    {
      name: "published_at",
      type: "DateTime64(3, 'UTC')",
      description: "Publication timestamp for recency ranking.",
    },
    {
      name: "engagement_score",
      type: "Float32",
      description: "Deterministic 0-1 resonance score.",
    },
  ],
};
const localTypes: FeedItemType[] = ["artifact", "editorial", "intent", "okf"];
function localBuild(total: number): FeedItem[] {
  const out: FeedItem[] = [];
  for (let i = 0; i < total; i += 1) {
    const type = localTypes[i % localTypes.length];
    const g = localGradients[i % localGradients.length];
    const isOkfSource = type === "okf" && i % 8 === 3;
    out.push({
      id: `local-${i}`,
      type,
      title:
        type === "okf"
          ? `Source · creator_intents #${i}`
          : `${type[0].toUpperCase()}${type.slice(1)} sample #${i}`,
      summary:
        "Local preview card. Connect through ChatGPT for the full unified feed.",
      tags: [type, "preview"],
      media: {
        kind:
          type === "editorial"
            ? "quote"
            : type === "okf"
              ? "chart"
              : "gradient",
        ratio: 0.7 + ((i * 37) % 80) / 100,
        accentFrom: g[0],
        accentTo: g[1],
      },
      author: { name: "Preview", role: type },
      metric:
        type === "intent" ? { label: "Resonance", value: "0.8" } : undefined,
      okf: isOkfSource
        ? {
            kind: "source",
            subtitle: "adaptive_media.creator_intents",
            body: "Local sample OKF source with a ClickHouse schema.",
            relations: ["person:sample"],
            table: localSampleTable,
          }
        : type === "okf"
          ? {
              kind: "concept",
              subtitle: "okf:concept/sample",
              body: "Local sample OKF concept node.",
              relations: ["source:creator_intents"],
            }
          : undefined,
      order: total - i,
    });
  }
  return out;
}
const localData = localBuild(40);
const LOCAL_PAGE = 8;
export function localBrowse(cursor?: string): FeedPage {
  const offset = cursor ? Number(cursor) : 0;
  const items = localData.slice(offset, offset + LOCAL_PAGE);
  const next = offset + items.length;
  const hasMore = next < localData.length;
  return {
    items,
    nextCursor: hasMore ? String(next) : null,
    hasMore,
    total: localData.length,
  };
}
