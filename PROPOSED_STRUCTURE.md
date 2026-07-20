# Proposed file structure

```text
adaptive-media/
├── server/
│   ├── index.ts                         # MCP transport and tool registration (phase 2)
│   ├── tools/
│   │   ├── contracts.ts                 # Shared MCP tool descriptor shape
│   │   ├── search-intents.ts
│   │   ├── create-intent.ts
│   │   ├── open-intent.ts
│   │   ├── personalize-intent.ts
│   │   ├── like-intent.ts
│   │   └── follow-creator.ts
│   ├── services/
│   │   ├── personalization.ts           # Adaptation and message-preservation rules
│   │   └── repository.ts                # JSON persistence (phase 2)
│   └── data/
│       ├── seed.ts
│       └── store.json                    # Runtime local state (phase 2, gitignored)
├── web/                                 # Intentionally deferred until validation
│   ├── discover/
│   ├── creator-profile/
│   ├── create-intent/
│   └── adaptive-experience/
├── shared/
│   ├── schemas.ts
│   └── validate.ts
├── IMPLEMENTATION_PLAN.md
├── PROPOSED_STRUCTURE.md
├── package.json
└── tsconfig.json
```
