# Integration plan — MCP feed logic into the Nextbound themed masonry

## Goal

Make the **functional MCP feed** (the interactive/data logic we built) render **inside the
Nextbound PROCEDURAL LOOP board** — the elaborate themed masonry that already has the `DESIGN`
selector (16 design modes), `WORLD` backgrounds, and `VIEW AS` persona (the user context).
The persona/user context and its visual theme come from the **memory skill** (OKF knowledge
base + per-persona style profiles).

We are NOT bolting a second feed on top. We take the interactive logic and put it into the
existing themed board.

## What already exists (do not rebuild)

| Piece | Where | Status |
|---|---|---|
| Feed data + pagination + OKF/ClickHouse | `server/artifact-feed.ts` (`browseFeed`, `openFeedItem`, `saveFeedItem`) | Works, tested |
| MCP tools registered | `server/index.ts` (`browse_artifact_feed`, `open_feed_item`, `save_feed_item`) | Works |
| Interactive logic reference | `web/src/artifact-feed.tsx` (cursor paging, infinite scroll, `buildItemContext`, `sendFollowUpMessage`, `open_feed_item` fallback) | Works, verified live |
| Themed masonry board | `web/src/nextbound.ts` loop-layout `news-feed` + `placeMasonry()` (l.1374-1437), `designMode` (16 modes, l.30-56), themed CSS `nextbound.css` | Works (no feed data) |
| MCP host bridge in the Alpine app | `web/src/nextbound-transport.ts` (`MCPNextboundTransport` → `window.openai`) | Works |
| Persona style profiles / OKF | `claude/skill-knowledge-base-mcp` branch: `.agents/skills/memory/`, `knowledge/persona_*/style.md` | On branch, to merge |

## Phases

### Phase 0 — Consolidate the integration branch
- Base: `integration/feed-merge` (already = feature functional ⊕ codex masonry/themes/media).
- Merge in `origin/claude/skill-knowledge-base-mcp-xascqp` (memory skill + persona style
  profiles + OKF format refs). Resolve `server/artifact-feed.ts` / `server/index.ts` overlap by
  keeping the integration branch's newer feed (the skill branch carries an older copy).
- Keep `@modelcontextprotocol/sdk` pinned at **1.29.0** (1.17.0 breaks every `registerTool`).

### Phase 1 — Feed data client inside the Alpine app
- Add a feed fetch through the existing bridge (`MCPNextboundTransport` / `window.openai.callTool`)
  calling `browse_artifact_feed` (with `cursor`, `type`, optional `persona`).
- Alpine state: `feedItems[]`, `feedCursor`, `feedHasMore`, `feedLoading`, `feedFilter`.
- `loadFeedPage()` (cursor pagination) + a sentinel + `IntersectionObserver` for infinite scroll,
  appending cards into the `news-feed` container that `placeMasonry()` already packs.

### Phase 2 — Feed cards as themed masonry widgets
- Render each `FeedItem` as a `[data-widget]` node in `.news-feed` so `placeMasonry()` lays it out
  and the `design-{mode}` + `WORLD` classes theme it automatically.
- Card variants per type: `artifact` / `editorial` / `intent` / `okf`; OKF `source` shows the
  ClickHouse schema preview; media band uses `accentFrom/accentTo` (toned per design mode).
- Match the existing loop-widget markup so all 16 themes apply with no per-card theme code.

### Phase 3 — Interaction (click → chat, native)
- Card click → `window.openai.sendFollowUpMessage({ prompt: buildItemContext(item) })`,
  fallback `callTool("open_feed_item", { itemId })`. Port `buildItemContext` from
  `artifact-feed.tsx`. Show a per-card "context sent" state.

### Phase 4 — User context + skill wiring
- `VIEW AS` persona → (a) design theme via `personaDesignPresets` (`nextbound.ts:49-56`),
  (b) persona **style profile** from `knowledge/persona_*/style.md` (memory skill),
  (c) optional feed personalization (`browse_artifact_feed` gains a `persona` filter server-side).
- The memory skill remains the way OKF sources + persona styles are authored into the bank.

### Phase 5 — Build, verify, deploy
- `npm run build:nextbound`; server serves it at `ui://nextbound/experience.html`.
- `tsc --noEmit`; `tsx --test server/*.test.ts` (feed tests must stay green).
- Redeploy the cloudflared tunnel; verify in ChatGPT/Claude: loop board shows feed cards,
  infinite scroll works, a card click sends context, themes switch live.

## Decisions to confirm
1. Target confirmed = Nextbound loop board (`nextbound.ts`, Alpine), feed as `[data-widget]` cards.
2. Merge the skill branch into `integration/feed-merge` (persona styles + OKF).
3. `browse_artifact_feed` gains an optional `persona` param for per-user personalization? (y/n)

## Risks
- `nextbound.ts` is large + `nextbound.css` ~6k lines; new cards must reuse existing widget markup
  so themes apply without bespoke CSS.
- Two Nextbound tests already fail on the codex branch (snapshot drift) — pre-existing, tracked.
- Alpine (nextbound) vs React (artifact-feed): logic is ported, not imported; keep one source of
  truth for the feed shape (`server/artifact-feed.ts`).
