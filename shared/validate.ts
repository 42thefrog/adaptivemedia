import {
  AudiencePersonaSchema,
  CreatorSchema,
  IntentSchema,
  PersonalizedExperienceSchema,
  UserPersonalDataSchema,
} from "./schemas.js";
import {
  audiencePersonas,
  creators,
  intents,
  personalizedExperiences,
  testUsers,
} from "../server/data/seed.js";
import { toolSchemas } from "../server/tools/api.js";
import { assertPersonalizationPolicy } from "./invariants.js";

creators.forEach((value) => CreatorSchema.parse(value));
intents.forEach((value) => IntentSchema.parse(value));
testUsers.forEach((value) => UserPersonalDataSchema.parse(value));
audiencePersonas.forEach((value) => AudiencePersonaSchema.parse(value));
personalizedExperiences.forEach((value) =>
  PersonalizedExperienceSchema.parse(value),
);
const toolNames = Object.keys(toolSchemas);
if (toolNames.length !== 8)
  throw new Error(
    `Expected 8 MCP tool contracts, received ${toolNames.length}`,
  );
const strictSearchInput = toolSchemas.search_public_intents;
if (strictSearchInput.safeParse({ query: "art", unexpected: true }).success)
  throw new Error("Tool inputs must reject unknown fields");
const source = intents[0];
assertPersonalizationPolicy(source, {
  id: "experience_validation",
  intentId: source.id,
  creatorId: source.creatorId,
  sourceIntentVersion: source.version,
  preservedImmutableMessage: source.immutableMessage,
  adaptableContent: {
    headline: "A personal cultural weekend",
    summary: "A small-scale route shaped around independent art.",
    itinerary: [
      {
        title: "Independent gallery",
        description: "Visit a small exhibition.",
        rationale: "Matches the stated interest.",
      },
    ],
    personalizationReasons: ["Independent art preference"],
  },
  commercialRecommendations: [],
  generatedAt: "2026-07-17T10:00:00+02:00",
});
console.log(
  `Validated ${creators.length} creators, ${intents.length} intents, ${audiencePersonas.length} personas, ${personalizedExperiences.length} experiences, and ${toolNames.length} strict tool contracts.`,
);
