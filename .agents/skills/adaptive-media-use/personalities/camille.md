---
name: adaptive-media-use-personality-camille
persona_id: persona_camille
description: Adaptive Media audience personality "camille", installed from the persona knowledge bundle so the adaptive-media-use skill can personalize experiences for this persona.
---

# Personality — camille

Installed from `knowledge/persona_camille/`. This is the knowledge the
`adaptive-media-use` skill loads when personalizing for `persona_camille`
(e.g. via `generate_experience`). Honor the personalization notes below.

<!-- source: knowledge/persona_camille/profile.md -->

---
type: Persona Profile
title: Camille — Curated Chaos Artistic Director
description: Premium-budget, aesthetic creator persona used to test visual, intimate and digitally collectible personalization for Noah, Amélie and Luna's intents.
tags: [persona, artistic-director, digital-art, premium-budget, non-technical]
timestamp: 2026-07-18T10:00:00+02:00
---

# Profile

| Field | Value |
|---|---|
| Persona ID | `persona_camille` |
| Name | Camille |
| Label | Curated Chaos Artistic Director |
| Age | 31 |
| Location | Paris |
| Occupation | Artistic director and aesthetic social media creator |
| Budget | Premium |
| Technical level | Non-technical but AI-aware |
| Interests | Art direction, digital art, NFT collecting, digital galleries, wellness, cozy jazz clubs, aesthetic vlogging |
| Preferred format | Visual, dopamine-rich, curated messy, intimate |
| Primary motivation | Turn daily life into a beautiful, health-conscious and digitally collectible aesthetic |

Source of record: `server/data/seed.ts` (`audiencePersonas`, `persona_camille`).

# Personalization notes

Camille responds to experiences that feel like a continuous aesthetic vlog:
small sensory scenes, satisfying arrangement, soft dopamine and cultural
signals. She likes controlled mess — objects, light, art books, screens and
personal rituals placed with intent — and dislikes loud, crowded or generic
environments.

Content aimed at her should feel intimate, visually composed and collectible.
Reference digital galleries, NFT collecting, cozy jazz-club atmospheres,
wellness investment and the tension between beautiful clutter and precise
art direction. Avoid noisy hype, over-explanation or outdoor extrovert energy.

# Artifact persona

```ikf
persona {
  id: "persona_camille"
  name: "Camille"
  archetype: "Curated Chaos Artistic Director"

  identity {
    role: "Artistic director"
    secondary_role: "Aesthetic social media creator"
    social_mode: "intimate, low-noise, culturally selective"
  }

  aesthetics {
    style: "curated messy beauty"
    mood: ["soft dopamine", "cozy jazz", "digital gallery", "beautiful clutter"]
    visual_language: ["intentional objects", "warm light", "screens as art", "wellness rituals"]
  }

  motivations {
    primary: "Make daily life feel beautiful, stimulating and collectible."
    secondary: "Transform lifestyle fragments into aesthetic cultural value."
  }

  avoids: ["loud rooms", "generic taste", "overcrowded plans", "visual disorder without intention"]
}
```

# Related

- [Vacation memory](/persona_camille/vacation.md)
- [Bundle index](/persona_camille/index.md)

# Citations

[1] [server/data/seed.ts](../../server/data/seed.ts)

---

<!-- source: knowledge/persona_camille/index.md -->

# Camille — Curated Chaos Artistic Director

* [Profile](profile.md) - core persona attributes (budget, interests, motivation, preferred format).
* [Style profile](style.md) - taste and design leaning, bound to the app theme `theme-camille`.
* [Command index](commands.json) - learned query→resolver cache + the persona `theme` (theme-camille); `local`, `mcp` and `theme` resolvers.
* [Vacation memory](vacation.md) - fictional Amalfi Coast trip used as narrative texture; photos are text placeholders.

---

<!-- source: knowledge/persona_camille/style.md -->

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

---

<!-- source: knowledge/persona_camille/vacation.md -->

---
type: Vacation Memory
title: Camille — Long Weekend on the Amalfi Coast
description: Fictional, premium-budget wellness trip used as narrative texture for the Camille persona. No real biographical data.
tags: [persona, vacation, fictional, premium-budget]
timestamp: 2026-07-18T10:00:00+02:00
---

This is synthetic demo content for the `persona_camille` audience persona.
It exists to give personalization prompts a lived-in, concrete memory to
draw on — it is not a real trip and not tied to a real person.

# Trip summary

A four-day escape to a boutique clifftop hotel near Positano, booked
deliberately short because a full week away from the brand portfolio she
runs was never on the table. Mornings were spent on a private terrace with
one espresso and zero notifications; afternoons on architecture walks
through the terraced towns.

# Photos

Image generation was not available in this session, so the photos below are
written as captioned placeholders. Swap each block for a generated or
sourced image using the same caption when one becomes available.

```
[PHOTO PLACEHOLDER 1 — image generation unavailable]
Caption: Camille on a whitewashed terrace overlooking the Amalfi coastline,
a single espresso cup on a stone ledge, linen shirt, phone face-down.
Suggested visual: soft morning light, muted whites and terracotta, minimal.
```

```
[PHOTO PLACEHOLDER 2 — image generation unavailable]
Caption: A detail shot of hand-painted majolica tiles on a stairway in
Positano, taken mid-walk, no people in frame — the kind of image she'd
actually save for a moodboard rather than post.
Suggested visual: close crop, warm ceramic tones, shallow depth of field.
```

```
[PHOTO PLACEHOLDER 3 — image generation unavailable]
Caption: Camille at a small clifftop restaurant table set for one, editing
a single slide on a tablet between courses, sea visible past the railing.
Suggested visual: golden-hour light, uncluttered composition, restrained.
```

# Why this matters for personalization

The trip reinforces Camille's core signal: she optimizes for restraint and
return on attention, not for volume of experience. Any adaptation aimed at
this persona should compress rather than elaborate, and should never
substitute enthusiasm for quality.

# Related

- [Profile](/persona_camille/profile.md)
- [Bundle index](/persona_camille/index.md)
