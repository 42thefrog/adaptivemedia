---
type: Style Profile
title: Alex — Style Profile
description: Alex's taste — direct, structured, developer-tool aesthetic — bound to the app's theme-alex (navy, blue/cream, sharp).
tags: [style, taste, theme-alex]
timestamp: 2026-07-18T10:00:00+02:00
---

# Visual

| Field | Value |
|---|---|
| App theme | `theme-alex` — the source of truth for his look (see `commands.json` → `theme`) |
| Palette | base `#0b1020` (dark navy background), accent `#3157c8` (blue), secondary `#f4efe2` (cream) |
| Fonts | `Inter, Arial, sans-serif` for body and display |
| Radius | `2px` — sharp, utilitarian corners |
| Feel | dark, structured, information-dense; reads like a good developer tool |

The concrete render target is the app theme, not a theme-factory preset: the
embedded feed applies `theme-alex` and its CSS vars exactly as
`web/src/nextbound.ts` (`profilePalette.alex`) does. Source of truth for the
palette is `knowledge/persona_alex/commands.json` → `theme`.

# Voice

| Field | Value |
|---|---|
| Tone | direct, concrete, technically confident |
| Do | lead with the payoff, show steps and code, keep it short and scannable |
| Avoid | long-form lifestyle framing, premium/aspirational fluff, over-explaining basics |

# Notes

Alex reads for a visible technical result. Anything that looks like marketing
gets skipped; anything that looks like a working, buildable artifact gets
attention. The dark, sharp-cornered navy theme should feel legible and dense
without being noisy — accent blue used sparingly to mark what matters.

# Related

- [Profile](/persona_alex/profile.md)
- [Command index](/persona_alex/commands.json)
- [Bundle index](/persona_alex/index.md)

# Citations

[1] [server/data/seed.ts](../../server/data/seed.ts) — `audiencePersonas`, `persona_alex` (direct, structured, practical).
[2] [web/src/nextbound.ts](../../web/src/nextbound.ts) — `profilePalette.alex` (the app theme this style is bound to).
[3] [Profile](/persona_alex/profile.md) — technical, low-budget, ships side projects even while travelling.
