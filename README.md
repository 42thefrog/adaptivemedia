# Nextbound

**Category:** Apps for your life

**Live demo:** [Nextbound](https://nextbound-adaptive-media.netlify.app/nextbound.html?scenario=procedural-loop)
**Public MCP:** `https://nextbound-adaptive-media.netlify.app/mcp`

## What we built

Stop searching. Nextbound is an MCP for ChatGPT and Codex. It turns one piece
of content into a version made for you.

The demo starts with Luna’s sneaker artifact and adapts it for:

- Alex — CEO, tech company
- Camille — Artistic director
- Maya — Developer

Each profile has a separate MCP render tool, so asking for Alex returns only
Alex’s artifact — never a combined gallery:

- `show_alex_artifact`
- `show_camille_artifact`
- `show_maya_artifact`

## Why it matters

Creators and brands usually choose between one generic asset or many expensive
campaign variants. Nextbound keeps one attributable source artifact and gives
each recipient a contextual experience instead of a recommendation or ad.

## Run locally

```bash
npm install
npm run typecheck
npm test
npm start
```

The local MCP endpoint is `http://127.0.0.1:3000/mcp`.

## Install the public MCP

### ChatGPT

1. Open **Settings → Plugins → Developer mode → Create an app**.
2. Enter `https://nextbound-adaptive-media.netlify.app/mcp`.
3. Choose **No authentication**, connect, then start a new chat.
4. Ask one of these:
   - `Show Luna’s artifact for Alex.`
   - `Show Luna’s artifact for Camille.`
   - `Show Luna’s artifact for Maya.`

### Codex

```bash
codex mcp add nextbound --url https://nextbound-adaptive-media.netlify.app/mcp
```

Start a new task and ask, for example:

```text
Open Nextbound and show Luna’s artifact for Maya.
```

## How Codex and GPT-5.6 were used

Codex with GPT-5.6 accelerated the product design, MCP server, personalized
artifact UI, Netlify deployment, debugging, and verification. The project
includes a working Streamable HTTP MCP server, public creator intents,
deterministic persona experiences, and an MCP Apps UI resource.

## Submission

- **Repository:** [github.com/42thefrog/adaptivemedia](https://github.com/42thefrog/adaptivemedia)
- **License:** [Apache-2.0](LICENSE)
- **Demo video:** [Nextbound pitch](https://youtu.be/eCJZ_co_HIA?si=rxAJwr6t9dkHj5XH)
- **Codex /feedback session ID:** `019f7e81-75a0-7f80-9035-64bd9c3e66ec`
