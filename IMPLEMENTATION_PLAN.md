# Adaptive Media MVP implementation plan

1. **Contracts (this phase):** validate shared Zod schemas, the immutable/adaptable content boundary, MCP tool inputs/outputs, and local seed fixtures.
2. **Server foundation:** add a JSON-file repository with atomic writes, implement tool handlers, and expose them over a Node MCP Streamable HTTP endpoint.
3. **Personalization:** generate an experience from an Intent plus a short profile while requiring the creator message to remain verbatim and traceable.
4. **Widget:** only after contract approval, build one React widget with discover, creator, authoring, and adaptive-experience views; connect it to MCP tool calls.
5. **Verification:** contract tests, persistence tests, personalization invariants, MCP Inspector smoke tests, then the Emma/David/Sarah demo journeys.

## Contract decisions to validate

- Published `immutableMessage` and its Intent `version` are immutable. Editing the message creates a new Intent version.
- Personalization may change only variables allow-listed by `adaptationRules`; it must not imply creator-authored details not present in the source.
- Commercial recommendations live outside organic adaptable content, must reference `approvedPartners`, and must reproduce the approved disclosure and URL.
- Personal data is supplied to personalization as a separate transient object and is neither stored on `Intent` nor copied into the generated experience.
- `open_intent` is the read/detail action. `personalize_intent` is separate because it creates user-specific output and may later invoke a model.
- Likes and follows are idempotent state setters (`active: true|false`) rather than ambiguous toggles.
- V1 accepts an app-local `actorId`; external authentication and payment fields are deliberately absent.
