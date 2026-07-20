# Nextbound

Stop searching. Nextbound is an MCP for ChatGPT and Codex. It turns one piece of content into a version made for you.

A creator publishes one artifact, once. Each recipient opens it inside ChatGPT or Codex and gets a version compiled for them, from context that stays on their side.

**Category:** Apps for your life

**Live demo (no setup):** https://nextbound-adaptive-media.netlify.app/nextbound.html?scenario=procedural-loop

**Public MCP endpoint (no authentication):** `https://nextbound-adaptive-media.netlify.app/mcp`

**Demo video:** https://youtu.be/eCJZ_co_HIA

## Team

| Name | Role |
|---|---|
| Zlata | Initiator, product vision |
| Chrys | Technical architecture |
| Take | Development |
| Edith | Product |

## What it does

The demo uses a fictional sneaker drop from a fictional creator, Luna Vale, and three audience personas:

- **Alex**, CEO of a tech company. An executive series page about travel, comfort and focus.
- **Camille**, artistic director. An editorial atelier spread about texture, softness and emotion.
- **Maya**, developer. A dark technical page built around a code block and durability tests.

`show_original_artifact` renders the artifact exactly as published, with no personalization. Putting the original next to the three versions is the product in one screen.

Each persona has its own tool, so asking for Alex returns Alex's artifact and never a combined gallery.

## For judges: three ways to test

### 1. Browser, 30 seconds, nothing to install

Open the [live demo](https://nextbound-adaptive-media.netlify.app/nextbound.html?scenario=procedural-loop) and switch between Alex, Camille and Maya.

### 2. ChatGPT

Supported on ChatGPT with Developer mode. Best viewed on desktop.

1. **Settings**, **Developer mode**, **Create an app**
2. MCP URL: `https://nextbound-adaptive-media.netlify.app/mcp`
3. Authentication: **No authentication**
4. Connect, open a new chat, add Nextbound, then ask:

```text
Show Luna's original artifact.
Show Luna's artifact for Alex.
Show Luna's artifact for Camille.
Show Luna's artifact for Maya.
```

### 3. Codex

```bash
codex mcp add nextbound --url https://nextbound-adaptive-media.netlify.app/mcp
```

Then start a task and ask: `Open Nextbound and show Luna's artifact for Maya.`

## Run locally

Requires Node.js 20 or later. Tested on Node 22.

```bash
npm install
npm run typecheck
npm test
npm start
```

The local MCP endpoint is `http://127.0.0.1:3000/mcp`.

Browser preview with all personas and demo states:

```bash
npm run dev:all
```

Then open `http://127.0.0.1:4173/`.

Inspect the MCP surface directly:

```bash
npm run inspect
```

## MCP surface

Eight tools over Streamable HTTP.

| Tool | Purpose |
|---|---|
| `show_alex_artifact` | Render the artifact for Alex, with widget |
| `show_camille_artifact` | Render the artifact for Camille, with widget |
| `show_maya_artifact` | Render the artifact for Maya, with widget |
| `show_original_artifact` | Render the artifact as published, no personalization |
| `search_public_intents` | Find a published creator artifact |
| `get_creator_profile` | Open a creator and their published work |
| `get_intent` | Inspect an original artifact before rendering |
| `generate_experience` | Compatibility alias for cached client manifests |

Widgets are served as MCP Apps resources (`text/html;profile=mcp-app`) and are also embedded in the tool result, so a client never needs a second round trip to render.

## Architecture

![Nextbound architecture](https://raw.githubusercontent.com/42thefrog/adaptivemedia/main/assets/architecture.png)

A creator publishes one artifact into the Nextbound API. The experience engine compiles it deterministically. Two surfaces consume the result: the web showcase, and the MCP server that Codex and the ChatGPT app call. The persona knowledge base never leaves the client: only the request crosses the boundary, never the person.

## Design decision: determinism

The experience engine runs on deterministic TypeScript domain services rather than a live model call at render time. This is deliberate. Someone opening the same artifact twice has to get the same experience, today and tomorrow. Personalisation that changes on every load is noise, and it makes attribution for the creator impossible.

The nine persona experiences are defined in `server/data/seed.ts` (three creators by three personas), and `server/service.test.ts` holds the invariants.

## Context stays on the client

Persona knowledge bases live in `knowledge/` as skill files: `profile.md`, `style.md`, `commands.json`. They describe a person's history, taste and constraints, and they are not a server-side user profile.

## How Codex and GPT-5.6 were used

The project was created between **July 17 and July 21, 2026**, entirely inside the Submission Period. Nothing in this repository predates the hackathon.

**Codex /feedback session ID:** `019f7e81-75a0-7f80-9035-64bd9c3e66ec`

We designed the architecture together with Codex, wrote an implementation plan, and executed it step by step. `IMPLEMENTATION_PLAN.md` and `PROPOSED_STRUCTURE.md` are the artifacts of that process. The MCP integration was done the same way.

Running on GPT-5.6, Codex wrote:

- the Streamable HTTP MCP server and its tool surface (`server/index.ts`)
- the deterministic persona services and seed data (`server/service.ts`, `server/data/seed.ts`)
- the MCP Apps widget resource (`web/mcp-widget.html`)
- the browser preview and the artifact feed (`web/src/`)
- the Netlify function entry and deployment config (`server/netlify-mcp-entry.ts`, `netlify.toml`)
- the test suite (39 tests, `npm test`)

What mattered most was not speed but legibility. Codex wrote down what it was doing and why at every step, so at any moment we knew where we were in a project that only existed for four days, and four people could work against one shared plan.

## Challenges

The hardest bug: the MCP tool returned correct text in ChatGPT while the widget refused to render, first as an empty block, then as `Failed to fetch template`.

We broke the deadlock by treating the deployed server as a black box and probing it with raw JSON-RPC calls instead of trusting the client. `resources/list` was correct, `resources/read` returned the full HTML, the assets returned 200. The server was fine, so the fault was in what the client was being told to do.

Three things were wrong, each sufficient on its own:

1. The tool result carried no `_meta`, so the template was declared on the descriptor but never echoed on the result.
2. The resource declared a custom widget domain whose root returned 404, so the client tried to fetch the template from an origin that served nothing.
3. The widget was only reachable through a separate `resources/read` call, which some clients never made.

The fixes were to echo `_meta` on the result, drop the custom domain, and embed the widget resource directly in the tool result.

## How this project maps to the judging criteria

**Technological implementation.** A working Streamable HTTP MCP server with eight tools, MCP Apps widget resources embedded directly in tool results, deterministic domain services, 39 passing tests, and a public deployment anyone can connect to without credentials. Every component listed under [How Codex and GPT-5.6 were used](#how-codex-and-gpt-56-were-used) was built with Codex running on GPT-5.6, from the MCP server and the persona services to the widget resource, the Netlify deployment and the tests. That section names the files, the dates and the `/feedback` session ID, so the claim is checkable against the commit history rather than taken on trust.

**Design.** Not a proof of concept: a complete path from a published artifact to a rendered personal experience, reachable three ways (browser, ChatGPT, Codex), with four distinct rendered outputs including the unpersonalized original for comparison. Loading, empty and error states are covered in the preview.

**Potential impact.** The problem is measurable and shared: an hour of scrolling to find one thing that fits. The audience is specific: people already working inside ChatGPT or Codex. The demonstration addresses the problem directly, and the economics follow from it, since a brand pays for one experience made for one person rather than for reach nobody asked for.

**Quality of the idea.** Not a recommender and not prompt-level personalisation. One attributable source artifact, one deterministic render per person, and a knowledge base that stays on the reader's device. The same person gets the same experience every time, which is what makes attribution possible for the creator.

## Known limits of the MVP

State for like, follow, save and share is in memory and resets when the server restarts. Share returns a stable demo reference, not a public URL. No authentication, no database, no production payment path.

## License

[Apache-2.0](LICENSE)
