import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import "./artifact-feed.css";

// --- Shared types (kept in sync with server/artifact-feed.ts) --------------

type FeedItemType = "artifact" | "editorial" | "intent" | "okf";
type OkfKind = "person" | "concept" | "document" | "source" | "resource";
type MediaKind = "gradient" | "image" | "code" | "chart" | "quote";

interface OkfField {
  name: string;
  type: string;
  description: string;
}
interface OkfTable {
  engine: "clickhouse";
  database: string;
  table: string;
  rowCountEstimate: number;
  partitionKey?: string;
  orderBy?: string;
  fields: OkfField[];
}
interface FeedMedia {
  kind: MediaKind;
  ratio: number;
  label?: string;
  accentFrom: string;
  accentTo: string;
}
interface FeedItem {
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
interface FeedPage {
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}
interface FeedItemDetail extends FeedItem {
  detail: {
    heading: string;
    paragraphs: string[];
    highlights: string[];
    table?: OkfTable;
    followUpPrompt: string;
  };
}

// --- window.openai bridge --------------------------------------------------
// The global Window.openai type is declared in web/src/vite-env.d.ts.

const bridge = () => window.openai;
const readOutput = (): any =>
  (bridge()?.toolOutput ?? (bridge()?.widgetState as any)?.data ?? {}) as any;

// --- Local preview fallback ------------------------------------------------
// Used only when the widget runs outside ChatGPT (npm run dev:feed), so the
// masonry, infinite scroll and open-as-artifact flow are all demoable locally.

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
const localTypes: FeedItemType[] = [
  "artifact",
  "editorial",
  "intent",
  "okf",
];
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
      metric: type === "intent" ? { label: "Resonance", value: "0.8" } : undefined,
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
function localBrowse(cursor?: string): FeedPage {
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
function localOpen(itemId: string): { selectedItem: FeedItemDetail } {
  const item = localData.find((i) => i.id === itemId) ?? localData[0];
  return {
    selectedItem: {
      ...item,
      detail: {
        heading: item.title,
        paragraphs: [item.summary, item.okf?.body ?? "Opened locally."],
        highlights: [`Tags: ${item.tags.join(", ")}`],
        table: item.okf?.table,
        followUpPrompt: `Open the feed item "${item.title}".`,
      },
    },
  };
}

// --- Data access -----------------------------------------------------------

async function callBrowse(
  cursor: string | undefined,
  type: FeedItemType | "all",
): Promise<FeedPage> {
  const api = bridge();
  if (api?.callTool) {
    const args: Record<string, unknown> = {};
    if (cursor) args.cursor = cursor;
    if (type !== "all") args.type = type;
    const res = await api.callTool("browse_artifact_feed", args);
    const data = (res?.structuredContent ?? {}) as Partial<FeedPage>;
    if (Array.isArray(data.items)) {
      return {
        items: data.items,
        nextCursor: data.nextCursor ?? null,
        hasMore: Boolean(data.hasMore),
        total: data.total ?? data.items.length,
      };
    }
  }
  return localBrowse(cursor);
}

async function callOpen(item: FeedItem): Promise<FeedItemDetail | null> {
  const api = bridge();
  // Preferred path: ask ChatGPT to run the tool so the item becomes a new
  // interactive artifact rendered beneath the feed in the conversation.
  if (api?.sendFollowUpMessage) {
    try {
      await api.sendFollowUpMessage({
        prompt: `Open the feed item "${item.title}" (id: ${item.id}) as an interactive artifact using the open_feed_item tool.`,
      });
      return null; // ChatGPT renders the new artifact; nothing to inline.
    } catch {
      // fall through to the direct-tool fallback
    }
  }
  // Fallback: call the MCP tool directly and render the detail inline.
  if (api?.callTool) {
    const res = await api.callTool("open_feed_item", { itemId: item.id });
    const data = (res?.structuredContent ?? {}) as {
      selectedItem?: FeedItemDetail;
    };
    if (data.selectedItem) return data.selectedItem;
  }
  return localOpen(item.id).selectedItem;
}

// --- UI --------------------------------------------------------------------

const typeLabel: Record<FeedItemType, string> = {
  artifact: "Interactive artifact",
  editorial: "Editorial · media",
  intent: "Intent · creation",
  okf: "Knowledge · OKF",
};

function Media({ item }: { item: FeedItem }) {
  const { media } = item;
  const height = Math.round(160 * media.ratio);
  const style: React.CSSProperties = {
    height,
    background: `linear-gradient(135deg, ${media.accentFrom}, ${media.accentTo})`,
  };
  return (
    <div className={`card-media media-${media.kind}`} style={style}>
      {item.type === "artifact" && <span className="media-chip">▶ interactive</span>}
      {media.kind === "chart" && <span className="media-chip">⛃ {media.label ?? "data"}</span>}
      {media.kind === "quote" && <span className="media-quote">“{item.summary.slice(0, 60)}…”</span>}
      {media.kind === "code" && <span className="media-chip">{"</>"} OKF</span>}
      {item.metric && (
        <span className="media-metric">
          <strong>{item.metric.value}</strong> {item.metric.label}
        </span>
      )}
    </div>
  );
}

function Card({
  item,
  onOpen,
  busy,
}: {
  item: FeedItem;
  onOpen: (item: FeedItem) => void;
  busy: boolean;
}) {
  return (
    <button
      className={`feed-card type-${item.type}`}
      onClick={() => onOpen(item)}
      disabled={busy}
      aria-label={`Open ${item.title}`}
    >
      <Media item={item} />
      <div className="card-body">
        <span className="card-kind">
          {typeLabel[item.type]}
          {item.okf ? ` · ${item.okf.kind}` : ""}
        </span>
        <h3 className="card-title">{item.title}</h3>
        <p className="card-summary">{item.summary}</p>
        {item.okf?.table && (
          <div className="card-schema-preview">
            {item.okf.table.database}.{item.okf.table.table} ·{" "}
            {item.okf.table.fields.length} fields
          </div>
        )}
        <div className="card-tags">
          {item.tags.slice(0, 3).map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
        {item.author && (
          <div className="card-author">
            <span className="dot" />
            {item.author.name} · {item.author.role}
          </div>
        )}
      </div>
      <span className="card-open">Open as artifact →</span>
    </button>
  );
}

function SchemaTable({ table }: { table: OkfTable }) {
  return (
    <div className="schema">
      <div className="schema-head">
        <div>
          <strong>
            {table.database}.{table.table}
          </strong>
          <span className="schema-engine">{table.engine}</span>
        </div>
        <div className="schema-meta">
          <span>~{table.rowCountEstimate.toLocaleString()} rows</span>
          {table.orderBy && <span>ORDER BY {table.orderBy}</span>}
          {table.partitionKey && <span>PARTITION {table.partitionKey}</span>}
        </div>
      </div>
      <table className="schema-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Semantic description</th>
          </tr>
        </thead>
        <tbody>
          {table.fields.map((f) => (
            <tr key={f.name}>
              <td className="f-name">{f.name}</td>
              <td className="f-type">
                <code>{f.type}</code>
              </td>
              <td className="f-desc">{f.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArtifactDetail({ item }: { item: FeedItemDetail }) {
  return (
    <section className="artifact-detail">
      <div
        className="detail-banner"
        style={{
          background: `linear-gradient(135deg, ${item.media.accentFrom}, ${item.media.accentTo})`,
        }}
      >
        <span className="detail-kind">
          {typeLabel[item.type]}
          {item.okf ? ` · ${item.okf.kind}` : ""}
        </span>
        <h2>{item.detail.heading}</h2>
      </div>
      <div className="detail-body">
        {item.detail.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {item.detail.highlights.length > 0 && (
          <ul className="detail-highlights">
            {item.detail.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        )}
        {item.detail.table && <SchemaTable table={item.detail.table} />}
      </div>
    </section>
  );
}

function Skeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="feed-card skeleton" style={{ height: 220 + (i % 3) * 40 }} />
      ))}
    </>
  );
}

function App() {
  const initial = readOutput();
  const initialSelected: FeedItemDetail | undefined = initial?.selectedItem;
  const initialPage: FeedItem[] = Array.isArray(initial?.items)
    ? initial.items
    : [];

  const [items, setItems] = useState<FeedItem[]>(initialPage);
  const [cursor, setCursor] = useState<string | null>(
    initial?.nextCursor ?? null,
  );
  const [hasMore, setHasMore] = useState<boolean>(
    initial?.hasMore ?? initialPage.length === 0,
  );
  const [total, setTotal] = useState<number>(initial?.total ?? 0);
  const [filter, setFilter] = useState<FeedItemType | "all">("all");
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [selected, setSelected] = useState<FeedItemDetail | null>(
    initialSelected ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const sentinel = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (nextCursor: string | undefined, replace: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const page = await callBrowse(nextCursor, filter);
        setItems((prev) => (replace ? page.items : [...prev, ...page.items]));
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
        setTotal(page.total);
      } catch (e) {
        setError("Could not load more of the feed.");
        setHasMore(false);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [filter],
  );

  // Initial load (or when there was no server-provided first page).
  useEffect(() => {
    if (initialPage.length === 0 && !selected) {
      void loadPage(undefined, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload from scratch when the type filter changes.
  const changeFilter = useCallback(
    (next: FeedItemType | "all") => {
      setFilter(next);
      setItems([]);
      setCursor(null);
      setHasMore(true);
      // loadPage closes over `filter`; defer to next tick after state set.
      setTimeout(() => {
        loadingRef.current = false;
        void (async () => {
          setLoading(true);
          try {
            const page = await callBrowse(undefined, next);
            setItems(page.items);
            setCursor(page.nextCursor);
            setHasMore(page.hasMore);
            setTotal(page.total);
          } finally {
            setLoading(false);
          }
        })();
      }, 0);
    },
    [],
  );

  // Infinite scroll via IntersectionObserver.
  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMore &&
          !loadingRef.current &&
          cursor
        ) {
          void loadPage(cursor, false);
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadPage]);

  const onOpen = useCallback(async (item: FeedItem) => {
    setOpening(item.id);
    try {
      const detail = await callOpen(item);
      if (detail) setSelected(detail); // fallback path renders inline
    } finally {
      setOpening(null);
    }
  }, []);

  const filters: (FeedItemType | "all")[] = [
    "all",
    "artifact",
    "editorial",
    "intent",
    "okf",
  ];

  return (
    <main className="feed-root">
      <header className="feed-header">
        <div className="feed-title">
          <span className="brand-symbol">N</span>
          <div>
            <h1>Adaptive Media Feed</h1>
            <p>
              A unified stream of artifacts, media, intents and OKF knowledge.
            </p>
          </div>
        </div>
        <div className="feed-filters">
          {filters.map((f) => (
            <button
              key={f}
              className={filter === f ? "chip active" : "chip"}
              onClick={() => changeFilter(f)}
            >
              {f === "all" ? "All" : typeLabel[f].split(" ")[0]}
            </button>
          ))}
        </div>
      </header>

      <div className="masonry">
        {items.map((item) => (
          <Card
            key={item.id}
            item={item}
            onOpen={onOpen}
            busy={opening === item.id}
          />
        ))}
        {loading && <Skeletons count={items.length === 0 ? 8 : 3} />}
      </div>

      {error && <p className="feed-error">{error}</p>}
      {!hasMore && items.length > 0 && (
        <p className="feed-end">
          You've reached the end · {items.length} of {total} items
        </p>
      )}
      <div ref={sentinel} className="feed-sentinel" aria-hidden />

      {selected && (
        <>
          <div className="detail-divider">
            <span>Opened artifact</span>
          </div>
          <ArtifactDetail item={selected} />
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
