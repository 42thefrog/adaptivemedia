---
okf_version: "0.1"
---

# Audience Persona Knowledge Bundle

Three knowledge bases, one per audience persona defined in
`server/data/seed.ts`. Each sub-bundle holds a structured profile and a
fictional "vacation memory" concept used to give personalization prompts
concrete texture. Photos are written as captioned text placeholders —
image generation was not available in this session; swap them for real or
generated images later using the same captions.

# Personas

* [Alex — Developer Student](persona_alex/) - low budget, technical, Paris.
* [Camille — Curated Chaos Artistic Director](persona_camille/) - premium budget, aesthetic creator, Paris.
* [Maya — 42 Paris Code Student](persona_maya/) - medium budget, project-driven, meme-fluent, Paris.

Each persona is bound to the app's real theme (`theme-alex`, `theme-camille`,
`theme-maya` — see `web/src/nextbound.ts`), stored in that persona's
`commands.json` → `theme` so the feed embedded in the chat is themed by the
personality. See the `memory` skill for how memory, style and theme compose.

# OKF Persona Artifacts

* [Camille artifact persona](camille-artifact-persona.okf) - curated chaos, digital art, wellness and cozy jazz mood.
* [Maya artifact persona](maya-code-student-persona.okf) - hoodie debugger, 42 Paris code-student energy, terminal-and-beer palette.
