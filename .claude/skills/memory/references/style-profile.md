# Style profile — a user's taste, mapped to a theme

`style.md` is what makes each user's artifact look like *theirs*. Memory holds
*what* to say; `style.md` holds *how it should feel and look*. The artifact
builder reads it and drives colors and fonts through the `theme-factory` skill,
so the same memory rendered under two different `style.md` files produces two
visibly different artifacts.

Keep one `style.md` per user at `knowledge/<user_id>/style.md`.

## Schema

Frontmatter follows the same OKF keys as any entry (see `okf-format.md`); use
`type: Style Profile`. The body captures taste in these sections:

```markdown
# Visual
| Field | Value |
|---|---|
| Theme | Golden Hour        # a theme-factory preset name, or "custom: <desc>"
| Palette leaning | warm, low-contrast, sand + terracotta, one deep accent
| Fonts mood | humanist serif headings, clean sans body
| Density | airy — generous whitespace, few elements per view
| Imagery | soft natural light, candid, film-like

# Voice
| Field | Value |
|---|---|
| Tone | warm, first-person, understated
| Do | short lines, sensory detail, sound like her own post
| Avoid | corporate templating, exclamation stacking, jargon

# Notes
Free-text nuance the tables can't hold — e.g. "protects a consistent personal
voice across everything; anything that reads as a template should be softened."
```

Only `Theme` is strictly required for the build to work; the rest sharpens it.
Fill what the sources actually support and leave the rest — don't invent taste.

## Mapping to theme-factory

`theme-factory` ships ten presets (Ocean Depths, Sunset Boulevard, Forest
Canopy, Modern Minimalist, Golden Hour, Arctic Frost, Desert Rose, Tech
Innovation, Botanical Garden, Midnight Galaxy) and can generate a custom theme
on the fly. In `style.md`:

- **Named preset** — set `Theme` to the exact preset name. The builder invokes
  `theme-factory`, reads that theme's palette and fonts, and applies them.
- **Custom** — set `Theme` to `custom: <short description>` and let the palette/
  font rows carry the specifics. The builder asks `theme-factory` to generate a
  theme from that description, then applies it.

Rough guide from taste signals to a preset (a starting point, not a rule):

| Signal in the input                    | Likely preset      |
|----------------------------------------|--------------------|
| minimal, monochrome, restrained        | Modern Minimalist  |
| warm, autumnal, cozy                   | Golden Hour        |
| bold, dark, technical, product-y       | Tech Innovation    |
| cool, crisp, clinical                  | Arctic Frost       |
| dramatic, cosmic, high-contrast dark   | Midnight Galaxy    |
| soft, dusty, sophisticated             | Desert Rose        |
| fresh, organic, botanical              | Botanical Garden   |

When the user states a preference directly ("she'd want it dark and techy"),
honor that over the table. When taste is thin, pick the closest preset, say so,
and let the user correct it — `style.md` is cheap to revise.

## Keeping it current

Taste shows up mid-conversation ("he hated the busy version", "keep it calmer").
During ingest (see `extraction.md`), fold those signals into `style.md` the same
way you fold facts into `profile.md`. Cite where the signal came from in the
entry's Citations so a future reader knows why the theme is what it is.
