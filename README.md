# Adaptive Media ChatGPT App — Step 7

The deterministic Nextbound engine supports two explicit widget transports: `local-preview` (the default browser preview) and `mcp` (injected by the MCP UI resource). Both call the same domain service layer. The self-contained MCP Apps widget resource is `ui://nextbound/experience.html` and includes Alpine, CSS, and JavaScript without CDN dependencies.

The existing server now also registers 13 Nextbound tools: `publish_intent`, `deliver_to_inbox`, `resolve_okf_context`, `compile_experience`, `resolve_next_action`, `match_tool`, `connect_artifact`, `get_experience_session`, `pause_experience`, `resume_experience`, `stop_experience`, `restart_experience`, and `share_experience`.

## Nextbound local experience engine

The pre-MCP Nextbound prototype runs beside the existing React/MCP app and uses a local, future-tool-shaped adapter over deterministic TypeScript domain services:

```bash
npm run dev:nextbound
```

Open `http://127.0.0.1:4174/nextbound.html`. Switch between Alex, Camille, and Maya; Maya contains the complete visual memory → Elias soundtrack → cinematic artifact path. No request is sent to `/mcp`.

This MVP connects three public creators, three public Intents, three audience personas, nine deterministic experiences, and the existing React widget through MCP Apps. The primary demo does not call a live model.

## Local preview (Step 6.5)

Install once, then launch the browser preview and local MCP server together:

```bash
npm install
npm run dev:all
```

Open `http://127.0.0.1:4173/`. The clearly marked Demo state selector covers all creators, all nine persona experiences, plus loading, empty, and error states. The normal discovery search and Like, Follow, Save, and Share demo actions remain interactive. Alex is the default persona.

No environment variables are required. `PORT` optionally overrides the MCP server's default port `3000`; the frontend remains on `4173`.

To run the processes separately:

```bash
npm start
npm run dev
```

## Build and inspect

```bash
npm install
npm run build:web
npm run format:check
npm run typecheck
npm test
npm start
```

The streamable HTTP endpoint is `http://127.0.0.1:3000/mcp`. In another terminal, launch MCP Inspector with:

```bash
npm run inspect
```

The eight tools are `search_public_intents`, `get_creator_profile`, `get_intent`, `generate_experience`, `like_intent`, `follow_creator`, `save_experience`, and `create_share_link`. All relevant results use the `ui://adaptive-media/widget.html` MCP UI resource.

## Artifact feed MCP App (`feature/chatgpt-artifact-feed`)

A second MCP App widget renders a **unified, infinite masonry feed** that mixes
four content families behind one paginated stream:

- **artifact** — interactive artifacts
- **editorial** — editorial / media content
- **intent** — intentions / creations
- **okf** — Open Knowledge Format knowledge-base entries (person, concept,
  document, source, resource). An OKF `source` can be a **ClickHouse table**;
  its schema is carried inline (each field has a name, a type, and a semantic
  description) and rendered as a readable table when the item is opened.

Two tools back it:

- `browse_artifact_feed` — returns one cursor-paginated page
  (`{ items, nextCursor, hasMore, total }`). Pass `nextCursor` back as `cursor`
  to drive the infinite scroll; optional `type` filters by family; optional
  `limit` (1–24, default 8).
- `open_feed_item` — opens a single item by `itemId` and returns it as a
  self-contained interactive artifact (`{ selectedItem }`), including the OKF
  ClickHouse schema for sources.

Both resolve to the `ui://adaptive-media/artifact-feed.html` MCP UI resource.
In the widget, selecting a card asks ChatGPT to run `open_feed_item` via
`window.openai.sendFollowUpMessage` (so the item appears as a **new artifact in
the conversation, beneath the feed**); if that API is unavailable it falls back
to a direct `window.openai.callTool("open_feed_item", …)` and renders the opened
artifact inline.

Build and run:

```bash
npm install
npm run build:all      # build:web + build:nextbound + build:feed
npm start              # streamable HTTP on 0.0.0.0:3000, health at /health
```

- Widget preview only: `npm run dev:feed` → `http://127.0.0.1:4176/artifact-feed.html`
  (works standalone via a local sample when `window.openai` is absent).
- Health check: `curl http://127.0.0.1:3000/health` →
  `{"status":"ok","service":"adaptive-media",…}`.
- The server binds `0.0.0.0` by default; override with `HOST` / `PORT`.

Golden prompts once connected in ChatGPT:

1. `Browse the Adaptive Media artifact feed.`
2. `Load more of the feed.` (infinite scroll / next cursor page)
3. `Open the "Source · creator_intents" item as an artifact.` (renders the
   ClickHouse schema table)

## Step 8 — temporary ChatGPT Developer Mode connection

Build and start the local MCP server:

```bash
npm run build:web
npm run build:nextbound
npm start
```

Its local endpoint is `http://127.0.0.1:3000/mcp`. In a second terminal, expose it with the already-installed Cloudflare quick tunnel:

```bash
cloudflared tunnel --url http://127.0.0.1:3000 --no-autoupdate
```

Use the generated endpoint in the form `https://<temporary-domain>/mcp`. Never commit the generated domain.

ChatGPT app metadata:

- Name: `Nextbound`
- Description: `Nextbound transforms one creator Intent into a personalized, evolving experience. Every user action can generate the next artifact, tool or creator contribution while preserving the original message and attribution.`
- MCP URL: `https://<temporary-domain>/mcp`
- Recommended discovery description: `Use Nextbound to receive and explore adaptive creator experiences, resolve personalized next actions and move through collaborative artifact graphs.`

To connect manually, open ChatGPT, open **Settings**, select **Security and login**, and enable **Developer Mode**. Open **Plugins management**, create a developer-mode app, and enter the name, description, and generated MCP URL above. Confirm that the 13 Nextbound tools are discovered. Then open a new conversation and add Nextbound to it.

Golden prompts, in order:

1. `Open the AFTERLIGHT experience from Luna Vale.`
2. `Deliver it to Alex, Camille and Maya.`
3. `Open the experience for Maya.`
4. `Create my visual memory.`
5. `Add a soundtrack.`
6. `Turn it into a short film.`
7. `Share this experience.`

Stop each foreground process with `Ctrl-C`: first in the tunnel terminal to revoke the temporary public route, then in the MCP server terminal. The quick tunnel has no uptime guarantee and is suitable only for temporary development. The demo has no authentication, persistence, public share URL, production deployment, or marketplace submission; state resets when the MCP server stops. ChatGPT account setup and final inline-widget QA remain manual.

## MVP limits

Like, follow, save, and share state is in memory and resets when the server restarts. Share returns a stable demo reference, not a publicly accessible URL. There is no authentication, database, external personalization service, production payment or deployment. Rebuild the single-file widget with `npm run build:web` after UI changes.
