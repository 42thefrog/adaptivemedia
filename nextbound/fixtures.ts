import type {
  Artifact,
  DemoTimelineScene,
  NextboundIntent,
  OKFProfile,
  ToolDefinition,
} from "./types.js";

export const intentDsl = `<nextbound-intent id="afterlight"><sender ref="luna-vale"/><immutable-message>What we remember is not what happened.\nIt is what the moment became inside us.</immutable-message><context-source type="personal-knowledge" format="OKF" permission="required"/><adapt based-on="history,interests,skills,visual-language"/><experience type="interactive-narrative"/><actions><action capability="explore"/><action capability="create"/><action capability="share"/></actions></nextbound-intent>`;
export const luna: NextboundIntent = {
  id: "afterlight",
  sender: {
    id: "luna-vale",
    name: "Luna Vale",
    role: "Fictional global singer and cultural creator",
  },
  campaign: "AFTERLIGHT — What will remain of you?",
  immutableMessage: {
    text: "What we remember is not what happened.\nIt is what the moment became inside us.",
    locked: true,
  },
  adaptationRules: [
    "format",
    "narrative",
    "visual_language",
    "tools",
    "next_actions",
    "interactive_components",
  ].map((field) => ({ field: field as any, allowed: true })),
  locked: [
    "original meaning",
    "Luna attribution",
    "creative boundaries",
    "campaign identity",
    "immutable message",
  ],
  capabilities: ["explore", "create", "share"],
};
export const profiles: OKFProfile[] = [
  {
    id: "alex",
    name: "Alex",
    role: "CEO",
    knowledge: [
      "startups",
      "SaaS",
      "customer acquisition",
      "company building",
      "product strategy",
      "leadership",
    ],
    preferences: ["strategic", "concise", "practical", "growth-focused"],
  },
  {
    id: "camille",
    name: "Camille",
    role: "Artistic Director",
    knowledge: [
      "graphic design",
      "motion design",
      "branding",
      "Figma",
      "visual systems",
      "creative direction",
    ],
    preferences: ["visual", "editorial", "refined", "trend-aware"],
  },
  {
    id: "maya",
    name: "Maya",
    role: "Developer Student",
    knowledge: [
      "Python",
      "local LLMs",
      "open source AI",
      "engineering reasoning",
      "developer projects",
      "AI tools",
    ],
    preferences: ["technical", "structured", "practical", "exploratory"],
  },
];
export const tools: ToolDefinition[] = [
  {
    id: "visual-builder",
    name: "Visual Artifact Builder",
    capabilities: ["visual_creation"],
    role: "tool_provider",
  },
  {
    id: "cinematic-composer",
    name: "Cinematic Artifact Composer",
    capabilities: ["short_film"],
    role: "tool_provider",
  },
];
export const eliasSoundscape: Artifact = {
  id: "memory-soundscape",
  title: "Memory Soundscape",
  type: "adaptive_soundtrack",
  creatorId: "elias-north",
  creatorName: "Elias North",
  preview:
    "A low pulse, glass harmonics, and a voice dissolving into distance.",
};
export const assetManifest = {
  lunaPortrait: "gradient://luna-portrait",
  alexEnvironment: "gradient://alex-node-field",
  camilleArchitecture: "gradient://camille-architecture",
  mayaMoodboard: "gradient://maya-moodboard",
  eliasArtwork: "gradient://memory-soundscape",
  finalCinematicArtifact: "gradient://afterlight-film",
} as const;
export const demoTimeline: DemoTimelineScene[] = [
  "Mass media saturation",
  "Luna publishes one Intent",
  "One Intent enters three inboxes",
  "Three profiles, three experiences",
  "Maya creates a visual memory",
  "The widget enriches itself",
  "Elias’s artifact connects",
  "The cinematic tool composes",
  "The contribution graph appears",
  "Nextbound vision",
].map((title, i) => ({
  id: `scene-${i + 1}`,
  duration: i === 0 ? 4 : 5,
  title,
  narration: "Narration placeholder",
  expectedState: [
    "saturation",
    "published",
    "inboxes",
    "comparison",
    "maya-node-2",
    "enriched",
    "maya-node-3",
    "maya-node-4",
    "graph",
    "vision",
  ][i],
  transitionType: i === 5 ? "expand" : i === 7 ? "morph" : "fade",
}));
