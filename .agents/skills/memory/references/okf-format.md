# OKF format — how memory entries are written

This is the exact shape used in `knowledge/`. The MCP feed
(`server/artifact-feed.ts`) and the widget rely on it, so entries you write have
to match what's already there. When in doubt, open a real file
(`knowledge/persona_maya/profile.md`) and mirror it.

## The bundle layout

```
knowledge/
├── index.md          # root: has `okf_version` frontmatter, lists every user
└── <user_id>/
    ├── index.md      # sub-bundle: links this user's entries with one-line blurbs
    ├── profile.md    # the person (OKF kind: person)
    ├── style.md      # taste profile (see style-profile.md)
    └── <slug>.md     # one file per concept / source / document / resource
```

Root `knowledge/index.md` carries the version:

```yaml
---
okf_version: "0.1"
---
```

Keep that version as-is unless the repo bumps it. Under it, list each user with a
link and a short descriptor, the way the personas are listed today.

## Entry frontmatter

Every entry file (except the index files) starts with YAML frontmatter using
exactly these keys, in this order:

```yaml
---
type: Persona Profile          # human-readable kind label (see mapping below)
title: Maya — Independent Creator
description: One sentence on what this entry holds and why it exists.
tags: [persona, creator, medium-budget, beginner]
timestamp: 2026-07-18T10:00:00+02:00
---
```

- `type` — a readable label, not the raw OKF kind. Existing examples:
  `Persona Profile`, `Vacation Memory`. Use a natural label and keep the OKF
  kind in mind for the feed (mapping below).
- `title` — what shows as the entry heading and the feed card title.
- `description` — one sentence; becomes the feed card summary/subtitle.
- `tags` — lowercase slugs, reused across entries so related items cluster.
- `timestamp` — ISO 8601 with offset. Do not invent a clock: use a timestamp
  the user gives, the source document's date, or ask. The current date is
  available to you from context — use it rather than guessing.

## Body sections

After the frontmatter, use this section order. Not every entry needs every
section, but keep the ones you use in this order so files read consistently:

1. `# <Heading>` — the entry's main content. For a profile this is a fact table
   plus notes; for a concept it's prose or a summary; for a source it's what the
   source is and how to reach it.
2. `# Personalization notes` *(profiles and taste-bearing entries)* — how this
   knowledge should steer content made for the user.
3. `# Related` — bullet links to sibling entries and the sub-bundle index, using
   root-relative paths as the existing files do:
   ```markdown
   # Related
   - [Vacation memory](/persona_maya/vacation.md)
   - [Bundle index](/persona_maya/index.md)
   ```
4. `# Citations` — numbered sources this entry came from. Every entry needs at
   least one, so memory stays traceable:
   ```markdown
   # Citations
   [1] [server/data/seed.ts](../../server/data/seed.ts)
   [2] Conversation with Claude, 2026-07-18 — "Maya's Lisbon shoot planning".
   ```
   Cite files with a relative link; cite a conversation or fed document by name
   and date. If the fed document is saved in the repo, link it.

## OKF kinds → files → feed

The MCP feed types an OKF entry by `kind` (`server/artifact-feed.ts`):
`person | concept | document | source | resource`. Map each durable item to a
kind, and let that drive the file and the `type` label:

| OKF kind   | Use it for                                   | Typical `type` label   | File example                     |
|------------|----------------------------------------------|------------------------|----------------------------------|
| `person`   | Who the user is; their profile               | `Persona Profile`      | `profile.md`                     |
| `concept`  | An idea, memory, preference, project, theme  | `Concept` / `Memory`   | `vacation.md`, `voice.md`        |
| `document` | A specific fed document captured as memory   | `Document`             | `brief-orbit-launch.md`          |
| `source`   | A dataset/system of record (e.g. a table)    | `Source`               | `intents-table.md`               |
| `resource` | A reusable asset (link, tool, template)      | `Resource`             | `brand-kit.md`                   |

A `source` of a ClickHouse table carries a schema (`OkfTable`): `engine`,
`database`, `table`, `rowCountEstimate`, optional `partitionKey`/`orderBy`, and
`fields[]` where every field has `name`, `type`, and a semantic `description`.
Only add a table when the source really is a dataset — see the
`clickhouseTables` examples in `server/artifact-feed.ts` before writing one.

## Index files

When you add or change an entry, update two indexes so nothing is orphaned:

- **Sub-bundle** `knowledge/<user_id>/index.md` — one bullet per entry, linking
  the file with a short blurb (see `persona_maya/index.md`).
- **Root** `knowledge/index.md` — one bullet per user. Only edit this when you
  add a *new* user folder.

## Checklist before writing

- Frontmatter keys present, in order, `timestamp` real not invented.
- Section order followed; `Related` uses root-relative links; `Citations` has ≥1.
- Chosen a valid OKF kind and a `type` label consistent with it.
- Existing entry merged into rather than duplicated.
- Both relevant index files updated.
