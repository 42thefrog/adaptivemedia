---
type: Style Profile
title: Camille — Style Profile
description: Camille's taste — curated-chaos artistic director, intimate and dopamine-rich — bound to the app's theme-camille (plum, pink/gold, serif).
tags: [style, taste, theme-camille]
timestamp: 2026-07-18T10:00:00+02:00
---

# Visual

| Field | Value |
|---|---|
| App theme | `theme-camille` — the source of truth for her look (see `commands.json` → `theme`) |
| Palette | base `#21131d` (dark plum background), accent `#ff79b8` (pink), secondary `#ffc857` (gold) |
| Fonts | `"Playfair Display", Georgia, serif` for both body and display |
| Radius | `34px` — soft, generous, gallery-rounded |
| Feel | intimate, dopamine-rich, curated mess; a beautiful vlog frame, art-directed |

The concrete render target is the app theme, not a theme-factory preset: the
embedded feed applies `theme-camille` and its CSS vars exactly as
`web/src/nextbound.ts` (`profilePalette.camille`) does. Source of truth for the
palette is `knowledge/persona_camille/commands.json` → `theme`.

# Voice

| Field | Value |
|---|---|
| Tone | intimate, sensory, culturally fluent; a continuous aesthetic vlog |
| Do | small composed scenes, soft dopamine, reference digital galleries / NFT collecting / cozy jazz, controlled mess placed with intent |
| Avoid | loud hype, over-explanation, generic or outdoor-extrovert energy |

# Notes

Camille likes controlled mess — objects, light, art books, screens and rituals
placed on purpose — and turns daily life into something beautiful, health-
conscious and digitally collectible. The plum/pink/gold serif theme carries that
tension between beautiful clutter and precise art direction.

# Related

- [Profile](/persona_camille/profile.md)
- [Command index](/persona_camille/commands.json)
- [Bundle index](/persona_camille/index.md)

# Citations

[1] [server/data/seed.ts](../../server/data/seed.ts) — `audiencePersonas`, `persona_camille` (curated-chaos artistic director; visual, dopamine-rich, intimate).
[2] [web/src/nextbound.ts](../../web/src/nextbound.ts) — `profilePalette.camille` (the app theme this style is bound to).
[3] [Profile](/persona_camille/profile.md) — art direction, digital art/NFT, cozy jazz, aesthetic vlogging.
