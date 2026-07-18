import type {
  AudiencePersona,
  Creator,
  Intent,
  PersonalizedExperience,
  UserProfile,
} from "../../shared/schemas.js";

const createdAt = "2026-07-01T10:00:00+02:00";
const voice = (qualities: string[], boundaries: string[] = []) => ({
  qualities,
  boundaries,
});
export const creators: Creator[] = [
  {
    id: "creator_noah",
    handle: "noahbuilds",
    displayName: "Noah Chen",
    bio: "AI founder, technology reviewer and mentor.",
    role: "AI founder, technology reviewer and mentor",
    category: "AI, Technology & Entrepreneurship",
    topics: [
      "OpenAI Build Week",
      "hackathon",
      "AI project",
      "mentoring",
      "developer tools",
    ],
    archetypes: ["Sage", "Magician", "Creator"],
    voiceGuidelines: voice(
      [
        "calm",
        "precise",
        "skeptical of hype",
        "educational",
        "practical",
        "action-oriented",
      ],
      [
        "Separate official information from interpretation",
        "Never invent event details",
      ],
    ),
    fictional: false,
    createdAt,
  },
  {
    id: "creator_amelie",
    handle: "amelie.skin",
    displayName: "Amélie Laurent",
    bio: "French beauty creator and skincare curator.",
    location: "Paris, France",
    role: "French beauty creator and skincare curator",
    category: "Beauty & Skincare",
    topics: ["beauty", "skincare", "personal routine", "French beauty"],
    archetypes: ["Lover", "Caregiver", "Creator"],
    voiceGuidelines: voice(
      ["warm", "refined", "intimate", "transparent", "non-judgmental"],
      [
        "No medical diagnoses or treatment claims",
        "Never use insecurity to sell",
      ],
    ),
    fictional: false,
    createdAt,
  },
  {
    id: "creator_luna",
    handle: "lunavale",
    displayName: "Luna Vale",
    bio: "Entirely fictional global singer, actress and cultural icon.",
    role: "Fictional global singer, actress and cultural icon",
    category: "Music, Culture & Lifestyle",
    topics: [
      "confidence",
      "music",
      "celebrity",
      "inspiration",
      "main-character",
    ],
    archetypes: ["Outlaw", "Jester", "Hero", "Lover"],
    voiceGuidelines: voice(
      [
        "cinematic",
        "witty",
        "emotionally direct",
        "slightly provocative",
        "supportive",
        "self-aware",
      ],
      [
        "Always identify Luna as fictional",
        "No medical or mental-health claims",
        "Do not trivialize serious trauma",
      ],
    ),
    fictional: true,
    createdAt,
  },
];

const makeIntent = (
  data: Pick<
    Intent,
    "id" | "creatorId" | "title" | "description" | "goal" | "immutableMessage"
  >,
  boundaries: string[],
  disclosure: string,
): Intent => ({
  ...data,
  adaptationRules: {
    allowedVariables: ["headline", "summary", "itinerary", "budgetNote"],
    outputFormats: ["structured personalized result", "shareable artifact"],
    boundaries: ["Preserve immutableMessage verbatim", ...boundaries],
  },
  resources: [],
  approvedPartners: [],
  monetization: { commercial: false, disclosure, partners: [] },
  visibility: "public",
  status: "published",
  publicationStatus: "published",
  version: 1,
  createdAt,
  updatedAt: createdAt,
  publishedAt: createdAt,
});
export const intents: Intent[] = [
  makeIntent(
    {
      id: "intent_noah_build_week",
      creatorId: "creator_noah",
      title: "Find Your OpenAI Build Week Project",
      description:
        "Turn the challenge into an achievable project concept, MVP scope and three-minute demo.",
      goal: "Create a clear, buildable AI-native project.",
      immutableMessage: {
        coreIdea:
          "The strongest hackathon project is not the most technically complicated one. It is the clearest demonstration of one new capability producing an immediately understandable result.",
        requiredClaims: [
          "1. Clear problem",
          "2. AI-native mechanism",
          "3. Visible transformation",
          "4. Buildable scope",
          "5. Distinct OpenAI value",
          "6. Growth potential",
        ],
        forbiddenChanges: [
          "Do not invent official dates, prizes, judging criteria or eligibility requirements.",
          "Do not remove or reorder the six-part framework.",
        ],
      },
    },
    ["Clearly separate official information from Noah’s interpretation"],
    "No sponsored or affiliate recommendations.",
  ),
  makeIntent(
    {
      id: "intent_amelie_beauty_ritual",
      creatorId: "creator_amelie",
      title: "Your Personal French Beauty Ritual",
      description:
        "A simple ritual adapted to lifestyle, budget and preferences without unnecessary products.",
      goal: "Build the smallest useful beauty routine first.",
      immutableMessage: {
        coreIdea: "Beauty should help people feel more like themselves.",
        requiredClaims: [
          "1. Understand the person’s real needs.",
          "2. Consider products they already own.",
          "3. Build the smallest useful routine first.",
          "4. Explain the purpose of every step.",
          "5. Never use insecurity to sell products.",
          "6. Disclose sponsored and affiliate recommendations.",
        ],
        forbiddenChanges: [
          "Do not produce medical diagnoses.",
          "Do not make treatment claims.",
          "Do not hide commercial relationships.",
        ],
      },
    },
    ["Avoid diagnoses and treatment claims"],
    "No sponsored or affiliate products are included in this demo.",
  ),
  makeIntent(
    {
      id: "intent_luna_main_character",
      creatorId: "creator_luna",
      title: "Turn This Moment Into Your Main-Character Scene",
      description:
        "Transform a moment into a cinematic scene, confidence ritual and shareable artifact.",
      goal: "Help someone remain present in their own story.",
      immutableMessage: {
        coreIdea:
          "Confidence is not the absence of embarrassment or fear. It is the decision to remain present in your own story.",
        requiredClaims: [
          "1. Cinematic scene title",
          "2. Personal reframing",
          "3. Short fictional Luna anecdote",
          "4. Confidence line",
          "5. Soundtrack mood",
          "6. Main Character Card",
        ],
        forbiddenChanges: [
          "Luna must always be identified as fictional.",
          "Do not make medical or mental-health claims.",
          "Do not trivialize serious trauma or infer private information.",
        ],
      },
    },
    ["Always identify Luna as fictional"],
    "No commercial recommendations.",
  ),
];

export const audiencePersonas: AudiencePersona[] = [
  {
    id: "persona_alex",
    name: "Alex",
    label: "Developer Student",
    age: 21,
    location: "Paris",
    occupation: "Computer science student and junior developer",
    budget: "Low",
    technicalLevel: "Intermediate",
    interests: ["AI", "open source", "gaming", "developer tools"],
    preferredFormat: ["direct", "structured", "practical"],
    primaryMotivation:
      "Build something impressive and improve technical skills.",
  },
  {
    id: "persona_camille",
    name: "Camille",
    label: "Curated Chaos Artistic Director",
    age: 31,
    location: "Paris",
    occupation: "Artistic director and aesthetic social media creator",
    budget: "Premium",
    technicalLevel: "Non-technical but AI-aware",
    interests: [
      "art direction",
      "digital art",
      "NFT collecting",
      "digital galleries",
      "wellness",
      "cozy jazz clubs",
      "aesthetic vlogging",
    ],
    preferredFormat: [
      "visual",
      "dopamine-rich",
      "curated messy",
      "intimate",
    ],
    primaryMotivation:
      "Turn daily life into a beautiful, health-conscious and digitally collectible aesthetic.",
  },
  {
    id: "persona_maya",
    name: "Maya",
    label: "42 Paris Code Student",
    age: 23,
    location: "Paris",
    occupation: "Programming student at 42 Paris",
    budget: "Medium",
    technicalLevel: "Intermediate, project-driven and meme-fluent",
    interests: [
      "programming memes",
      "peer coding",
      "hanging out with friends",
      "hoodies",
      "beer",
      "Paris student life",
    ],
    preferredFormat: ["funny", "practical", "social", "low-friction"],
    primaryMotivation:
      "Learn by building with friends, keep code playful and turn school projects into shared wins.",
  },
];

const titles: Record<string, Record<string, string>> = {
  creator_noah: {
    persona_alex: "Open Source Agent Debugger",
    persona_camille: "Adaptive Client Atelier",
    persona_maya: "Adaptive Campaign",
  },
  creator_amelie: {
    persona_alex: "Screen-Time Reset",
    persona_camille: "Five-Minute Executive Ritual",
    persona_maya: "Camera-Ready Without the Ten-Step Routine",
  },
  creator_luna: {
    persona_alex: "Scene 04: He Finally Let Other People See What He Built",
    persona_camille:
      "Scene 22: She Entered the Room Before Anyone Was Ready for Her",
    persona_maya: "Scene 18: She Posted the Idea Before the Trend Had a Name",
  },
};
const summaries: Record<string, string> = {
  creator_noah:
    "A focused concept with a buildable MVP and a visible three-minute transformation.",
  creator_amelie:
    "A minimal, transparent ritual using only purposeful steps and products already owned where possible.",
  creator_luna:
    "A cinematic reframe, confidence ritual and shareable Main Character Card from fictional Luna Vale.",
};
export const personalizedExperiences: PersonalizedExperience[] =
  intents.flatMap((intent) =>
    audiencePersonas.map((persona) => {
      const creator = creators.find((item) => item.id === intent.creatorId)!;
      const title = titles[creator.id][persona.id];
      const steps = intent.immutableMessage.requiredClaims.map(
        (claim, index) => ({
          title: claim,
          description:
            creator.id === "creator_noah"
              ? [
                  "A concrete audience pain point.",
                  "A deterministic AI workflow with a clear role.",
                  "Show the before-and-after in the demo.",
                  "Limit the MVP to one golden path.",
                  "Explain exactly why OpenAI enables the result.",
                  "Name one credible extension after Build Week.",
                ][index]
              : creator.id === "creator_amelie"
                ? [
                    "Fit the ritual to the real day and stated preferences.",
                    "Start with products already available.",
                    "Keep only the smallest useful routine.",
                    "State the purpose of this step plainly.",
                    "This recommendation never relies on insecurity.",
                    "No sponsored or affiliate products are included.",
                  ][index]
                : [
                    title,
                    "Reframe the moment as choosing visibility over permission.",
                    "Fictional Luna once rehearsed an entrance to an empty lift, then laughed when the doors opened early.",
                    "Stay in the frame; the moment belongs to you too.",
                    "Bold synths, a dry drumbeat and one victorious string swell.",
                    `${title} — present before perfect.`,
                  ][index],
          rationale: `Preserves the creator’s required methodology for ${persona.name}.`,
        }),
      );
      return {
        id: `experience_${intent.id}_${persona.id}`,
        intentId: intent.id,
        creatorId: creator.id,
        personaId: persona.id,
        sourceIntentVersion: 1,
        creatorAttribution: `${creator.displayName}${creator.fictional ? " (fictional)" : ""} ${creator.handle.startsWith("@") ? creator.handle : `@${creator.handle}`}`,
        originalIntentTitle: intent.title,
        personalizedTitle: title,
        matchExplanation: `${persona.name}’s ${persona.preferredFormat.join(", ")} format and ${persona.primaryMotivation.toLowerCase()} align with this adaptation.`,
        preservedImmutableMessage: structuredClone(intent.immutableMessage),
        structuredResult: steps,
        suggestedNextAction:
          creator.id === "creator_noah"
            ? "Sketch the golden path and record a three-minute demo."
            : creator.id === "creator_amelie"
              ? "Try the smallest routine with products you already own."
              : "Save or share your Main Character Card.",
        shareableArtifact: {
          title,
          preview: `${title} — ${intent.immutableMessage.coreIdea}`,
          format:
            creator.id === "creator_luna"
              ? "Main Character Card"
              : "Share card",
        },
        commercialDisclosure: intent.monetization.disclosure,
        adaptableContent: {
          headline: title,
          summary: summaries[creator.id],
          itinerary: steps,
          budgetNote: `${persona.budget} budget adaptation.`,
          personalizationReasons: [persona.label, ...persona.preferredFormat],
        },
        commercialRecommendations: [],
        generatedAt: createdAt,
      };
    }),
  );

// Legacy profiles remain accepted by the unchanged MCP contract.
export const testUsers: UserProfile[] = audiencePersonas.map((p) => ({
  id: p.id,
  displayName: p.name,
  party: { adults: 1, relationship: "solo" },
  budget: {
    amount: p.budget === "Low" ? 50 : p.budget === "Medium" ? 200 : 600,
    currency: "EUR",
  },
  interests: p.interests,
  preferences: p.preferredFormat,
  accessibilityNeeds: [],
  locale: "en",
}));
