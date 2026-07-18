---
type: Style Profile
title: Maya — Style Profile
description: Maya's taste — a playful, meme-fluent 42 Paris code student — bound to the app's theme-maya (dark, monospace, cyan/lime).
tags: [style, taste, theme-maya]
timestamp: 2026-07-18T10:00:00+02:00
---

# Visual

| Field | Value |
|---|---|
| App theme | `theme-maya` — the source of truth for her look (see `commands.json` → `theme`) |
| Palette | base `#061421` (deep night-blue background), accent `#38d9ff` (cyan), secondary `#9dff57` (lime) |
| Fonts | `"DM Mono", monospace` for body/code, `Inter` for display |
| Radius | `8px` — soft-but-utilitarian |
| Feel | dark, terminal-adjacent, neon accents; a build-log that happens to look good |

The concrete render target is the app theme, not a theme-factory preset: the
embedded feed applies `theme-maya` and its CSS vars exactly as
`web/src/nextbound.ts` (`profilePalette.maya`) does. Source of truth for the
palette is `knowledge/persona_maya/commands.json` → `theme`.

# Voice

| Field | Value |
|---|---|
| Tone | funny, practical, social; sounds like a 42 Paris group chat |
| Do | short and useful, meme-fluent, turn a bug into a joke before fixing it, ship-first |
| Avoid | corporate polish, over-explained theory, anything too serious to paste in a project channel |

# Notes

Maya wants to take code seriously without being boring about it. Content should
feel useful inside the rhythms of 42 Paris — peer review, late-night debugging,
campus jokes, hoodie weather, post-project beers. The dark neon-mono theme is
part of that identity: it reads as a dev who has taste, not a lifestyle brand.

# Related

- [Profile](/persona_maya/profile.md)
- [Command index](/persona_maya/commands.json)
- [Bundle index](/persona_maya/index.md)

# Citations

[1] [server/data/seed.ts](../../server/data/seed.ts) — `audiencePersonas`, `persona_maya` (42 Paris code student; funny, practical, social, low-friction).
[2] [web/src/nextbound.ts](../../web/src/nextbound.ts) — `profilePalette.maya` (the app theme this style is bound to).
[3] [Profile](/persona_maya/profile.md) — 42 Paris coding student, meme-fluent, peer-driven.
