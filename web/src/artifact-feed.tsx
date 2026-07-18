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

// Build a compact context blob for a selected item — this is what gets sent
// into the conversation so the user and the model can discuss the item.
function buildItemContext(item: FeedItem): string {
  const lines: string[] = [];
  lines.push(
    "Context for the feed item I just selected — let's discuss it.",
    "",
    `Title: ${item.title}`,
    `Type: ${item.type}${item.okf ? ` · ${item.okf.kind}` : ""}`,
    `Id: ${item.id}`,
    `Summary: ${item.summary}`,
  );
  if (item.okf?.body) lines.push(item.okf.body);
  if (item.author) lines.push(`By: ${item.author.name} · ${item.author.role}`);
  lines.push(`Tags: ${item.tags.join(", ")}`);
  const table = item.okf?.table;
  if (table) {
    lines.push(
      "",
      `Source ${table.database}.${table.table} (${table.engine}, ~${table.rowCountEstimate.toLocaleString()} rows). Fields:`,
      ...table.fields.map((f) => `- ${f.name} (${f.type}): ${f.description}`),
    );
  }
  return lines.join("\n");
}

// Send the selected item's context into the conversation. Preferred path:
// window.openai.sendFollowUpMessage posts it as a message so the host chat can
// discuss it. Falls back to calling the open_feed_item tool directly.
// Returns true if the context was handed to an MCP host; false when running
// with no host (plain browser preview) so the caller can show a local preview.
function sendItemContext(item: FeedItem): boolean {
  const api = bridge();
  const prompt = buildItemContext(item);
  if (api?.sendFollowUpMessage) {
    void api.sendFollowUpMessage({ prompt });
    return true;
  }
  if (api?.callTool) {
    void api.callTool("open_feed_item", { itemId: item.id });
    return true;
  }
  return false;
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
  onSelect,
  sent,
}: {
  item: FeedItem;
  onSelect: (item: FeedItem) => void;
  sent: boolean;
}) {
  return (
    <button
      className={`feed-card type-${item.type}${sent ? " sent" : ""}`}
      onClick={() => onSelect(item)}
      aria-label={`Discuss ${item.title} in the chat`}
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
      <span className="card-open">
        {sent ? "✓ Context sent to chat" : "→ Discuss in chat"}
      </span>
    </button>
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
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<FeedItem | null>(null);
  const [themeP, setThemeP] = useState<"alex" | "camille" | "maya">("camille");

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
    if (initialPage.length === 0) {
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

  // Selecting a card is an instruction to the chat: it sends the item's
  // context into the conversation (via sendFollowUpMessage) so the model can
  // discuss it. The widget itself does not open or store anything.
  const onSelect = useCallback((item: FeedItem) => {
    const sent = sendItemContext(item);
    setSentIds((prev) => new Set(prev).add(item.id));
    // No MCP host (plain browser preview): show the item inline so the feed
    // stays testable locally instead of the click doing nothing.
    if (!sent) setPreview(item);
  }, []);

  const filters: (FeedItemType | "all")[] = [
    "all",
    "artifact",
    "editorial",
    "intent",
    "okf",
  ];

  const personaTheme = (p: "alex" | "camille" | "maya") => {
    setThemeP(p);
    const api = bridge();
    // VIEW AS also pulls the persona from the knowledge base skill when a host
    // is connected (design par user + KB profile).
    if (api?.sendFollowUpMessage) {
      void api.sendFollowUpMessage({
        prompt: `View the feed as "${p}": install that persona from the knowledge base (install_personality) and apply its style.`,
      });
    } else if (api?.callTool) {
      void api.callTool("install_personality", { personality: p });
    }
  };
  const personas: ("alex" | "camille" | "maya")[] = ["alex", "camille", "maya"];

  return (
    <main className={`feed-root theme-${themeP}`}>
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

      <div className="view-as">
        <span>VIEW AS · design par user :</span>
        {personas.map((p) => (
          <button
            key={p}
            className={themeP === p ? "view-btn active" : "view-btn"}
            onClick={() => personaTheme(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="masonry">
        {items.map((item) => (
          <Card
            key={item.id}
            item={item}
            onSelect={onSelect}
            sent={sentIds.has(item.id)}
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

      {preview && (
        <>
          <div className="detail-divider">
            <span>Preview · this context would be sent to chat</span>
          </div>
          <section className="artifact-detail">
            <div
              className="detail-banner"
              style={{
                background: `linear-gradient(135deg, ${preview.media.accentFrom}, ${preview.media.accentTo})`,
              }}
            >
              <span className="detail-kind">
                {typeLabel[preview.type]}
                {preview.okf ? ` · ${preview.okf.kind}` : ""}
              </span>
              <h2>{preview.title}</h2>
            </div>
            <div className="detail-body">
              <p>{preview.summary}</p>
              {preview.okf?.body && <p>{preview.okf.body}</p>}
              <ul className="detail-highlights">
                {preview.author && (
                  <li>
                    {preview.author.role}: {preview.author.name}
                  </li>
                )}
                <li>Tags: {preview.tags.join(", ")}</li>
              </ul>
              {preview.okf?.table && (
                <div className="schema">
                  <div className="schema-head">
                    <div>
                      <strong>
                        {preview.okf.table.database}.{preview.okf.table.table}
                      </strong>
                      <span className="schema-engine">
                        {preview.okf.table.engine}
                      </span>
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
                      {preview.okf.table.fields.map((f) => (
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
              )}
            </div>
          </section>
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
