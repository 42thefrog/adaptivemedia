---
name: adaptive-media-use
description: Drive the Adaptive Media / Nextbound MCP server — discover creator Intents, generate deterministic personalized experiences, browse the OKF artifact feed — and feed its knowledge base. Use when the human asks to use Adaptive Media, Nextbound, install an audience personality, or feed the Adaptive Media knowledge base.
---

# Use the Adaptive Media MCP

Adaptive Media (a.k.a. Nextbound) turns one creator Intent into a personalized,
evolving experience while preserving the original message and attribution. This
skill is the functional layer: it tells you which MCP tools to call and how to
grow the knowledge base the tools read from.

Connect to the Streamable HTTP endpoint at `/mcp` (default
`http://127.0.0.1:3000/mcp`; health at `/health`). Every tool is
deterministic — no live model — so calls replay identically.

## Tools

Discovery & experiences:
- `search_public_intents` — search published public creator Intents.
- `get_creator_profile` — open a creator profile and their Intents.
- `get_intent` — open the original Intent before personalization.
- `generate_experience` — return the seeded personalized experience for an
  audience persona (Alex, Camille, Maya). Reads the installed **personality**
  (see below) as personalization texture.
- `like_intent`, `follow_creator`, `save_experience`, `create_share_link`
  — local demo state.

Knowledge feed (OKF):
- `browse_artifact_feed` — one cursor-paginated page of the unified feed
  (artifact, editorial, intent, okf). Pass `nextCursor` back as `cursor`.
- `open_feed_item` — open one item as a self-contained artifact (OKF sources
  include their ClickHouse schema).
- `save_feed_item` — write a feed item as a local Markdown document.

Install:
- `install_mcp_skill` — install this skill.
- `install_personality` — install an audience personality (below).

Nextbound experience engine: `publish_intent`, `deliver_to_inbox`,
`resolve_okf_context`, `compile_experience`, `resolve_next_action`,
`match_tool`, `connect_artifact`, `get_experience_session`,
`pause_experience`, `resume_experience`, `stop_experience`,
`restart_experience`, `share_experience`, plus the procedural runtime
(`open_seed`, `execute_artifact_contract`, `process_interaction`,
`resolve_nextbounds`, `get_artifact_execution`, `get_session_trace`,
`replay_session`).

## Personalities

An audience **personality** is one persona's knowledge bundle installed at the
exact place this skill reads from:

```text
adaptive-media-use/personalities/<persona>.md
```

To install one, call `install_personality` with the persona name — e.g. the
human types **"get camille personnalité"**, you call
`install_personality { "personality": "camille" }`. The tool pulls
`knowledge/persona_camille/` from the server's knowledge base and writes
`personalities/camille.md` here. When personalizing for that persona
(`generate_experience`), load `personalities/<persona>.md` and honor
its personalization notes.

Installed personalities are additive — installing one never overwrites another.

## Feed the knowledge base

Two knowledge bases back this MCP:

1. **Persona knowledge (files)** under `knowledge/persona_<id>/`. Add a new
   audience persona by creating that folder with a `profile.md` (front-matter
   `type: Persona Profile`, a profile table, and personalization notes),
   an `index.md`, and any narrative texture files. The source of record for
   the structured fields is `server/data/seed.ts` (`audiencePersonas`).
   Once the folder exists, `install_personality` can install it.

2. **OKF feed knowledge (in-code)** in `server/artifact-feed.ts`. Add an
   entry to the `seeds` array (family `artifact | editorial | intent | okf`);
   an `okf` `source` may carry a ClickHouse table schema
   (name + type + semantic description per field). New seeds surface through
   `browse_artifact_feed` / `open_feed_item` automatically.

Keep everything deterministic: no clocks, no randomness, so pages and
experiences stay reproducible.

## Run locally — the procedural loop board

The elaborate themed masonry ("procedural loop") is the Nextbound board. On a
fresh machine that does not have the repo yet, clone the right branch first,
then cd in, then install and run:

```bash
git clone -b deploy/procedural-loop https://github.com/42thefrog/adaptivemedia.git
cd adaptivemedia
npm install
npm run build:all          # web + nextbound + feed widgets
npm start                  # MCP server on 0.0.0.0:3000 (/mcp, /health)
npm run dev:nextbound      # (other terminal) vite on 127.0.0.1:4174
```

Open `http://127.0.0.1:4174/nextbound.html?scenario=procedural-loop` — the
masonry board with the DESIGN (16 modes), WORLD, and VIEW-AS persona controls,
and the feed cards rendered inside it. To expose the MCP over HTTPS for
ChatGPT/Claude: `cloudflared tunnel --url http://127.0.0.1:3000` then use
`https://<domain>/mcp`. In ChatGPT the loop board renders on the side via the
`ui://nextbound/experience.html` resource (it defaults to the procedural-loop
scenario).
