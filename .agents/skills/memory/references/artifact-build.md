# Build — memory through the MCP feed, rendered in the user's style

Building an artifact here is not free-form HTML. The repo already has an artifact
feed (`server/artifact-feed.ts`) and a widget that render OKF entries. So
"build from memory" means: turn a user's `knowledge/<user_id>/` entries into the
feed's item shape, let the MCP tools render them, and apply the user's theme.
That reuse is the whole point — memory content flows straight into the existing
pipeline instead of a one-off page.

## Step 1 — Load the user's memory

Read, from `knowledge/<user_id>/`:
- `profile.md` — who the artifact is for / about.
- `style.md` — how it should look (see `style-profile.md`).
- The concept / source / document entries relevant to the ask. Don't pull the
  whole folder if the user asked for one thing; pull what's on-topic.

Use only what's in memory. If the artifact needs a fact that isn't there, that's
an ingest gap — capture it first (see `extraction.md`), don't invent it.

## Step 2 — Shape memory as feed items

Match the types in `server/artifact-feed.ts`. Each memory entry becomes a
`FeedItem`; OKF entries carry the `okf` block:

```ts
FeedItem {
  id, type: "okf",           // or "artifact" | "editorial" | "intent"
  title,                     // entry title
  summary,                   // entry description (one line)
  tags,                      // entry tags
  media: { kind, ratio, accentFrom, accentTo, label? },
  okf: {
    kind,                    // person | concept | document | source | resource
    subtitle,
    body,                    // the entry's main prose
    relations,              // titles/links of Related entries
    table?                   // only for a `source` that is a dataset (OkfTable)
  },
  order,                     // deterministic sort key, higher = newer
}
```

Notes that keep the feed working:
- Keep it **deterministic** — no clocks, no randomness. The same memory yields
  the same items, which is what makes `browse_artifact_feed` idempotent and
  testable. Derive `order` from a stable field (e.g. entry timestamp), not from
  "now".
- A `source` with a ClickHouse table must carry a full `OkfTable`
  (`engine`, `database`, `table`, `rowCountEstimate`, `fields[]` each with
  `name`/`type`/`description`). Only add one when the source is genuinely a
  dataset — see `clickhouseTables` in `server/artifact-feed.ts`.
- `media.accentFrom`/`accentTo` should come from the user's theme (Step 3), not
  arbitrary gradients — that's part of what personalizes the card.

The MCP tools that consume this shape:
- `browse_artifact_feed` — one cursor-paginated page
  (`{ items, nextCursor, hasMore, total }`); this is the stream the masonry
  widget scrolls.
- `open_feed_item` — one item opened as its own self-contained artifact
  (`FeedItemDetail`, with `detail.heading`, `paragraphs`, `highlights`, optional
  `table`, and a `followUpPrompt`).

So "inject memory into the MCP" concretely means: produce valid feed items from
the user's entries so these tools return them. If the task is to extend the live
demo, follow the existing dataset construction in `artifact-feed.ts` and its
tests rather than bolting on a parallel path.

## Step 3 — Apply the user's style via theme-factory

Read `style.md`, then use the `theme-factory` skill:

1. Take the `Theme` value — a preset name, or `custom: <desc>`.
2. Invoke `theme-factory`: for a preset, read that theme's palette and fonts;
   for custom, have it generate a theme from the description + the palette/font
   rows in `style.md`.
3. Apply the theme's colors and fonts to the artifact — card gradients
   (`media.accentFrom`/`accentTo`), headings, body, accents. Respect the
   `Density` and `Voice` from `style.md` in layout and copy.

Same memory + a different `style.md` must yield a visibly different artifact.
If it doesn't, the style layer isn't actually driving the render — fix that
before shipping.

## Step 4 — Verify

Before handing back:
- **Faithful to memory** — every fact in the artifact traces to a real entry.
  No invented content.
- **Actually themed** — colors/fonts come from the user's theme, not defaults.
- **Feed-valid** — items match the `FeedItem`/`okf` shape; a `source` table is
  well-formed; `order` is deterministic. If you touched `artifact-feed.ts` or
  its data, run the repo's tests (`npm test`) and the MCP smoke path
  (`npm run inspect`) as the README describes.

Then show the artifact and say which memory entries and which theme it came
from, so the user can trace it back.
