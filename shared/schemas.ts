import { z } from "zod";

export const IdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9_-]*$/);
export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export const CurrencySchema = z
  .string()
  .length(3)
  .transform((value) => value.toUpperCase());

const NonEmptyText = z.string().trim().min(1);

export const CreatorSchema = z
  .object({
    id: IdSchema,
    handle: z
      .string()
      .min(2)
      .max(40)
      .regex(/^[a-z0-9_.]+$/),
    displayName: z.string().min(1).max(100),
    bio: z.string().min(1).max(500),
    location: z.string().max(120).optional(),
    topics: z.array(NonEmptyText).max(20),
    avatarUrl: z.string().url().optional(),
    role: NonEmptyText,
    category: NonEmptyText,
    archetypes: z
      .array(
        z.enum([
          "Sage",
          "Magician",
          "Creator",
          "Lover",
          "Caregiver",
          "Outlaw",
          "Jester",
          "Hero",
        ]),
      )
      .min(1),
    voiceGuidelines: z
      .object({
        qualities: z.array(NonEmptyText).min(1),
        boundaries: z.array(NonEmptyText).default([]),
      })
      .strict(),
    fictional: z.boolean().default(false),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export const CreatorArchetypeSchema = z.enum([
  "Sage",
  "Magician",
  "Creator",
  "Lover",
  "Caregiver",
  "Outlaw",
  "Jester",
  "Hero",
]);
export const VoiceGuidelinesSchema = CreatorSchema.shape.voiceGuidelines;

/** Author-owned content. A published version must be copied verbatim into every output. */
export const ImmutableMessageSchema = z
  .object({
    coreIdea: NonEmptyText.max(2_000),
    requiredClaims: z.array(NonEmptyText.max(500)).min(1).max(20),
    forbiddenChanges: z.array(NonEmptyText.max(500)).min(1).max(20),
  })
  .strict()
  .readonly();

/** Explicit allow-list for model-controlled output. Everything not listed is denied. */
export const AdaptationRulesSchema = z
  .object({
    allowedVariables: z.array(NonEmptyText.max(100)).min(1).max(30),
    outputFormats: z.array(NonEmptyText.max(100)).min(1).max(20),
    boundaries: z.array(NonEmptyText.max(500)).min(1).max(30),
  })
  .strict()
  .readonly();

export const ResourceSchema = z
  .object({
    title: NonEmptyText.max(200),
    content: NonEmptyText.max(10_000),
    url: z.string().url().optional(),
  })
  .strict()
  .readonly();

/** Commercial eligibility declared by the author, never silently merged with resources. */
export const ApprovedPartnerSchema = z
  .object({
    name: NonEmptyText.max(200),
    disclosure: NonEmptyText.max(500),
    url: z.string().url(),
  })
  .strict()
  .readonly();

export const MonetizationDisclosureSchema = z
  .object({
    commercial: z.boolean(),
    disclosure: NonEmptyText,
    partners: z.array(ApprovedPartnerSchema),
  })
  .strict();

export const IntentSchema = z
  .object({
    id: IdSchema,
    creatorId: IdSchema,
    title: NonEmptyText.max(160),
    description: NonEmptyText.max(2_000),
    goal: NonEmptyText.max(1_000),
    immutableMessage: ImmutableMessageSchema,
    adaptationRules: AdaptationRulesSchema,
    resources: z.array(ResourceSchema).max(100),
    approvedPartners: z.array(ApprovedPartnerSchema).max(50),
    monetization: MonetizationDisclosureSchema,
    visibility: z.enum(["public", "unlisted", "private"]),
    status: z.enum(["draft", "published"]),
    publicationStatus: z.enum(["draft", "published"]),
    version: z.number().int().positive(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    publishedAt: IsoDateTimeSchema.optional(),
  })
  .strict()
  .superRefine((intent, ctx) => {
    if (intent.status === "published" && !intent.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishedAt"],
        message: "Published intents require publishedAt",
      });
    }
  });

export const AudiencePersonaSchema = z
  .object({
    id: IdSchema,
    name: NonEmptyText,
    label: NonEmptyText,
    age: z.number().int().positive(),
    location: NonEmptyText,
    occupation: NonEmptyText,
    budget: z.enum(["Low", "Medium", "Premium"]),
    technicalLevel: NonEmptyText,
    interests: z.array(NonEmptyText).min(1),
    preferredFormat: z.array(NonEmptyText).min(1),
    primaryMotivation: NonEmptyText,
  })
  .strict();

export const ShareableArtifactSchema = z
  .object({ title: NonEmptyText, preview: NonEmptyText, format: NonEmptyText })
  .strict();

/** Private user data has its own lifecycle and is not a child of Intent. */
export const UserPersonalDataSchema = z
  .object({
    id: IdSchema,
    displayName: z.string().min(1).max(100).optional(),
    party: z
      .object({
        adults: z.number().int().min(1).max(20),
        relationship: z.enum([
          "solo",
          "partner",
          "friends",
          "family",
          "colleagues",
        ]),
      })
      .strict(),
    budget: z
      .object({ amount: z.number().nonnegative(), currency: CurrencySchema })
      .strict(),
    availableMinutes: z.number().int().positive().max(43_200).optional(),
    interests: z.array(NonEmptyText).max(30),
    preferences: z.array(NonEmptyText).max(30),
    accessibilityNeeds: z.array(NonEmptyText).max(20).default([]),
    locale: z.string().min(2).default("en"),
  })
  .strict();

export const ExperienceItemSchema = z
  .object({
    title: NonEmptyText,
    description: NonEmptyText,
    durationMinutes: z.number().int().positive().optional(),
    estimatedCost: z
      .object({ amount: z.number().nonnegative(), currency: CurrencySchema })
      .strict()
      .optional(),
    rationale: NonEmptyText,
  })
  .strict();

export const CommercialRecommendationSchema = z
  .object({
    partnerName: NonEmptyText,
    title: NonEmptyText,
    description: NonEmptyText,
    disclosure: NonEmptyText,
    url: z.string().url(),
  })
  .strict();

export const PersonalizedExperienceSchema = z
  .object({
    id: IdSchema,
    intentId: IdSchema,
    creatorId: IdSchema,
    sourceIntentVersion: z.number().int().positive(),
    preservedImmutableMessage: ImmutableMessageSchema,
    personaId: IdSchema.optional(),
    creatorAttribution: NonEmptyText.optional(),
    originalIntentTitle: NonEmptyText.optional(),
    personalizedTitle: NonEmptyText.optional(),
    matchExplanation: NonEmptyText.optional(),
    structuredResult: z.array(ExperienceItemSchema).min(1).optional(),
    suggestedNextAction: NonEmptyText.optional(),
    shareableArtifact: ShareableArtifactSchema.optional(),
    commercialDisclosure: NonEmptyText.optional(),
    adaptableContent: z
      .object({
        headline: NonEmptyText,
        summary: NonEmptyText,
        itinerary: z.array(ExperienceItemSchema).min(1),
        budgetNote: z.string().optional(),
        personalizationReasons: z.array(NonEmptyText).min(1),
      })
      .strict(),
    commercialRecommendations: z.array(CommercialRecommendationSchema),
    generatedAt: IsoDateTimeSchema,
  })
  .strict();

export const LikeSchema = z
  .object({
    id: IdSchema,
    actorId: IdSchema,
    intentId: IdSchema,
    createdAt: IsoDateTimeSchema,
  })
  .strict();
export const FollowSchema = z
  .object({
    id: IdSchema,
    actorId: IdSchema,
    creatorId: IdSchema,
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export type Creator = z.infer<typeof CreatorSchema>;
export type CreatorArchetype = z.infer<typeof CreatorArchetypeSchema>;
export type VoiceGuidelines = z.infer<typeof VoiceGuidelinesSchema>;
export type Intent = z.infer<typeof IntentSchema>;
export type ImmutableMessage = z.infer<typeof ImmutableMessageSchema>;
export type AdaptationRules = z.infer<typeof AdaptationRulesSchema>;
export type MonetizationDisclosure = z.infer<
  typeof MonetizationDisclosureSchema
>;
export type AudiencePersona = z.infer<typeof AudiencePersonaSchema>;
export type ShareableArtifact = z.infer<typeof ShareableArtifactSchema>;
export type UserPersonalData = z.infer<typeof UserPersonalDataSchema>;
export type UserProfile = UserPersonalData;
export type PersonalizedExperience = z.infer<
  typeof PersonalizedExperienceSchema
>;
export type Like = z.infer<typeof LikeSchema>;
export type Follow = z.infer<typeof FollowSchema>;
