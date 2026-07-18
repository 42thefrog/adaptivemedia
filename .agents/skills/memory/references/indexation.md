# Indexation — the learned command index (`commands.json`)

The problem this solves: a front-end/artifact query names *what* it wants ("get
the last vacation photo") but not *where* it lives in memory. Solving that from
scratch every time is wasteful. So each user keeps a learned index that maps an
intent to a reusable **resolver**. The first time a query is solved, its
resolver is written down; every later time is a direct lookup.

Think of it as a growing, per-user cache of "how to answer this kind of ask".

## Where it lives

`knowledge/<user_id>/commands.json` — one index per user, because most commands
are about *that* person's memory ("*her* last vacation photo"). A command that
is genuinely global can live in a root `knowledge/commands.json`; when both
exist, resolve the user index first, then fall back to root.

## File shape

```json
{
  "okf_version": "0.1",
  "user_id": "persona_maya",
  "commands": [
    {
      "name": "last_vacation_photo",
      "intent": "get the last photo of the vacation",
      "aliases": ["dernière photo des vacances", "latest vacation picture"],
      "resolver": {
        "type": "local",
        "source": "vacation.md",
        "locator": { "match": "PHOTO PLACEHOLDER", "select": "last" },
        "op": "extract_caption"
      },
      "returns": "The caption of the last vacation photo placeholder.",
      "learned_from": "Conversation with Claude, 2026-07-18 — front-end query.",
      "timestamp": "2026-07-18T10:00:00+02:00"
    }
  ]
}
```

Fields per command:
- `name` — a stable snake_case command id; this is the memorized "command".
- `intent` — the canonical natural-language query it answers.
- `aliases` — other phrasings (incl. other languages) that should map here.
- `resolver` — how to actually get the data (see the two kinds below).
- `returns` — one line on what the resolver yields, so a reader knows the shape.
- `learned_from` — a citation of how this command was first resolved, keeping
  the index as traceable as the rest of memory.
- `timestamp` — ISO 8601; use a real time (see `okf-format.md`), don't invent one.

## Resolver kinds

### `local` — read the knowledge base directly

Declarative, deterministic. It says which file to read, how to locate the piece,
and what to do with it — no arbitrary code stored in memory.

```json
"resolver": {
  "type": "local",
  "source": "vacation.md",                 // file(s) under knowledge/<user_id>/
  "locator": { "match": "PHOTO PLACEHOLDER", "select": "last" },
  "op": "extract_caption"                    // extract | list | count | first | last | section
}
```

`locator` options: a `match` (substring or `regex:`-prefixed pattern), a
`section` heading, and a `select` (`first` | `last` | `all` | an index). `op`
names the transform to apply to what the locator found. Keep ops to simple,
nameable retrieval so any reader can predict the output.

### `mcp` — delegate data access to an MCP tool

For live or external data, don't copy it into memory — reference the MCP call.
The command stores the server, tool, and args; running the resolver means making
that MCP call. The data stays in the MCP, always fresh.

```json
"resolver": {
  "type": "mcp",
  "server": "App_Next_Media",
  "tool": "browse_artifact_feed",
  "args": { "type": "okf", "limit": 8 },
  "note": "Live data via MCP — not cached in the knowledge base."
}
```

Fill `args` from the query when needed (e.g. a persona id, a cursor). If a call
needs a value the query doesn't supply, that's a resolve-time input to ask for,
not something to guess.

## The resolve / learn flow

1. **Normalize** the incoming query (lowercase, trim, strip filler).
2. **Look up** in `commands.json` — match `name`, `intent`, or an `alias`.
   Prefer an exact/alias match; a close paraphrase of an existing `intent`
   should reuse that command rather than spawn a near-duplicate.
3. **Hit** → run the resolver:
   - `local`: read the file(s), apply `locator` + `op`, return the result.
   - `mcp`: make the MCP call with `args`, return its result.
4. **Miss** → resolve once, then memorize:
   - Search the KB for where the answer lives, or discover the right MCP source.
   - Produce the answer for the caller.
   - **Append** a new command capturing what you just did — `name`, `intent`,
     `aliases`, the `resolver` you used, `returns`, `learned_from`. This is the
     "code-gen once, reuse forever" step: the ad-hoc resolution becomes a named
     command.

Appending a *new* learned command is safe to do automatically. **Editing or
removing** an existing command changes behavior the front-end may rely on — that
follows the skill's propose-before-write rule (show the change, get a yes).

## MCP-backed sources

"Add a new data source via MCP" means: register the source as an OKF `source`
entry (see `okf-format.md` / `templates/source.md`) whose body describes the MCP
access instead of embedding the data — server, tool(s), what it returns, and any
auth/scope caveat. Then commands reach it with an `mcp` resolver. The `source`
entry is the human-readable *reference*; the MCP is the *live data*. Example
source body:

```markdown
# Recent Intents (MCP-backed)

Live source. Access via MCP, not stored here.

| Property | Value |
|---|---|
| Server | App_Next_Media |
| Tool | search_public_intents |
| Returns | published intents for a creator |
| Scope | read-only; needs a creator id at call time |
```

Keeping data access in the MCP means memory never goes stale on live data and
never duplicates it — the index just remembers *which* MCP call answers *which*
intent.

## Quality bar

- Resolver is deterministic and predictable from what's written (no hidden code).
- New commands are appended with a `learned_from` citation; existing ones edited
  only via propose-before-write.
- `mcp` resolvers reference real tools/args; missing inputs are asked for, not
  guessed.
- No near-duplicate commands — a paraphrase reuses the existing command's aliases.
