import { assertPersonalizationPolicy } from "../shared/invariants.js";
import type {
  Creator,
  Intent,
  PersonalizedExperience,
} from "../shared/schemas.js";
import {
  audiencePersonas,
  creators as seedCreators,
  intents as seedIntents,
  personalizedExperiences as seedExperiences,
} from "./data/seed.js";

const clone = <T>(value: T): T => structuredClone(value);
const personaSeedId = (id: string) => `persona_${id}`;
const personaSummary = () =>
  audiencePersonas.map(({ id, name, label }) => ({
    id: id.replace("persona_", ""),
    name,
    label,
  }));
const publicPublished = (intent: Intent) =>
  intent.visibility === "public" &&
  intent.status === "published" &&
  intent.publicationStatus === "published";

export class DemoError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class AdaptiveMediaService {
  readonly creators: Creator[];
  readonly intents: Intent[];
  readonly experiences: PersonalizedExperience[];
  private readonly liked = new Set<string>();
  private readonly followed = new Set<string>();
  private readonly saved = new Set<string>();
  private readonly shares = new Map<string, string>();

  constructor(data: { creators?: Creator[]; intents?: Intent[] } = {}) {
    this.creators = clone(data.creators ?? seedCreators);
    this.intents = clone(data.intents ?? seedIntents);
    this.experiences = clone(data.intents ? [] : seedExperiences);
  }

  searchPublicIntents({
    query,
    limit = 10,
  }: {
    query: string;
    limit?: number;
  }) {
    const terms = query
      .toLowerCase()
      .replace(/[^\p{L}\p{N}-]+/gu, " ")
      .split(/\s+/)
      .filter(Boolean);
    const boosts: Record<string, string[]> = {
      creator_noah: [
        "openai",
        "build",
        "week",
        "hackathon",
        "ai",
        "project",
        "technology",
        "mentoring",
      ],
      creator_amelie: [
        "beauty",
        "skincare",
        "routine",
        "personal",
        "recommendation",
      ],
      creator_luna: [
        "confidence",
        "music",
        "celebrity",
        "inspiration",
        "main",
        "character",
        "main-character",
      ],
    };
    const results = this.intents
      .filter(publicPublished)
      .map((intent) => {
        const creator = this.mustCreator(intent.creatorId);
        const haystack = [
          creator.displayName,
          creator.handle,
          creator.category,
          creator.role,
          ...creator.topics,
          intent.title,
          intent.description,
          intent.goal,
          ...intent.immutableMessage.requiredClaims,
        ]
          .join(" ")
          .toLowerCase();
        const direct = terms.filter((term) => haystack.includes(term));
        const boosted = terms.filter((term) =>
          boosts[creator.id]?.includes(term),
        );
        const matchScore = terms.length
          ? Math.round(
              Math.min(
                1,
                (direct.length + boosted.length * 1.5) / terms.length,
              ) * 100,
            ) / 100
          : 1;
        return {
          creator: {
            id: creator.id,
            name: creator.displayName,
            handle: `@${creator.handle}`,
            role: creator.role,
            category: creator.category,
            avatar: creator.avatarUrl,
            archetypes: creator.archetypes,
          },
          intent: {
            id: intent.id,
            title: intent.title,
            description: intent.description,
          },
          matchScore,
          matchReason: `${creator.displayName} matches ${[...new Set([...direct, ...boosted])].join(", ") || creator.category}.`,
          ...(intent.monetization.disclosure
            ? { monetizationLabel: intent.monetization.disclosure }
            : {}),
        };
      })
      .filter((item) => !terms.length || item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
    return { query, results };
  }

  getCreatorProfile(creatorId: string) {
    const creator = this.mustCreator(creatorId);
    const publicIntents = this.intents
      .filter((i) => i.creatorId === creatorId && publicPublished(i))
      .map((i) => ({ id: i.id, title: i.title, description: i.description }));
    return {
      creator: {
        id: creator.id,
        name: creator.displayName,
        handle: `@${creator.handle}`,
        role: creator.role,
        category: creator.category,
        bio: creator.bio,
        archetypes: creator.archetypes,
        voiceGuidelines: creator.voiceGuidelines,
        fictional: creator.fictional,
        followersCount:
          this.baseFollowers(creator.id) +
          Number(this.followed.has(creator.id)),
        experiencesCount: this.experiences.filter(
          (e) => e.creatorId === creator.id,
        ).length,
        helpfulScore: 98,
      },
      publicIntents,
      following: this.followed.has(creator.id),
    };
  }

  getIntent(intentId: string) {
    const intent = this.mustPublicIntent(intentId);
    const creator = this.mustCreator(intent.creatorId);
    return {
      intent: {
        id: intent.id,
        creatorId: intent.creatorId,
        title: intent.title,
        description: intent.description,
        goal: intent.goal,
        immutableMessage: clone(intent.immutableMessage),
        adaptationRules: clone(intent.adaptationRules),
        resources: clone(intent.resources),
        monetization: clone(intent.monetization),
        visibility: intent.visibility,
        publicationStatus: intent.publicationStatus,
      },
      creator: {
        id: creator.id,
        name: creator.displayName,
        handle: `@${creator.handle}`,
      },
      availablePersonas: personaSummary(),
      liked: this.liked.has(intent.id),
      likeCount: Number(this.liked.has(intent.id)),
    };
  }

  generateExperience(intentId: string, personaId: "alex" | "camille" | "maya") {
    const intent = this.mustPublicIntent(intentId);
    const experience = this.experiences.find(
      (e) =>
        e.intentId === intentId && e.personaId === personaSeedId(personaId),
    );
    if (!experience)
      throw new DemoError(
        "unknown_experience",
        "No deterministic experience exists for this Intent and persona.",
      );
    assertPersonalizationPolicy(intent, experience);
    return {
      experience: {
        id: experience.id,
        intentId: experience.intentId,
        personaId,
        creatorAttribution: experience.creatorAttribution,
        originalIntentTitle: experience.originalIntentTitle,
        personalizedTitle: experience.personalizedTitle,
        matchExplanation: experience.matchExplanation,
        structuredOutcome: {
          steps: clone(experience.structuredResult),
          summary: experience.adaptableContent.summary,
        },
        preservedCreatorMessage: clone(experience.preservedImmutableMessage),
        suggestedNextAction: experience.suggestedNextAction,
        shareableArtifactPreview: clone(experience.shareableArtifact),
        ...(experience.commercialDisclosure
          ? { commercialDisclosure: { label: experience.commercialDisclosure } }
          : {}),
        saved: this.saved.has(experience.id),
      },
      availablePersonas: personaSummary(),
    };
  }

  likeIntent(intentId: string, liked: boolean) {
    this.mustPublicIntent(intentId);
    liked ? this.liked.add(intentId) : this.liked.delete(intentId);
    return {
      intentId,
      liked,
      likeCount: Number(liked),
      persistence: "local_demo" as const,
    };
  }
  followCreator(creatorId: string, following: boolean) {
    this.mustCreator(creatorId);
    following ? this.followed.add(creatorId) : this.followed.delete(creatorId);
    return {
      creatorId,
      following,
      followerCount: this.baseFollowers(creatorId) + Number(following),
      persistence: "local_demo" as const,
    };
  }
  saveExperience(experienceId: string, saved: boolean) {
    this.mustExperience(experienceId);
    saved ? this.saved.add(experienceId) : this.saved.delete(experienceId);
    return { experienceId, saved, persistence: "local_demo" as const };
  }
  createShareLink(experienceId: string) {
    const experience = this.mustExperience(experienceId);
    const intent = this.mustPublicIntent(experience.intentId);
    const creator = this.mustCreator(intent.creatorId);
    const shareId = `share_${experienceId}`;
    this.shares.set(experienceId, shareId);
    return {
      shareId,
      creator: {
        id: creator.id,
        name: creator.displayName,
        handle: `@${creator.handle}`,
      },
      intent: { id: intent.id, title: intent.title },
      artifact: clone(experience.shareableArtifact),
      mode: "demo" as const,
    };
  }

  private baseFollowers(id: string) {
    return id === "creator_noah"
      ? 12800
      : id === "creator_amelie"
        ? 24100
        : 7300000;
  }
  private mustCreator(id: string) {
    const value = this.creators.find((x) => x.id === id);
    if (!value)
      throw new DemoError("unknown_creator", `Unknown creator: ${id}`);
    return value;
  }
  private mustIntent(id: string) {
    const value = this.intents.find((x) => x.id === id);
    if (!value) throw new DemoError("unknown_intent", `Unknown Intent: ${id}`);
    return value;
  }
  private mustPublicIntent(id: string) {
    const value = this.mustIntent(id);
    if (value.visibility === "private")
      throw new DemoError("private_intent", "This Intent is private.");
    if (value.status !== "published" || value.publicationStatus !== "published")
      throw new DemoError("draft_intent", "This Intent is a draft.");
    if (value.visibility !== "public")
      throw new DemoError(
        "private_intent",
        "Only public Intents are available in this demo.",
      );
    return value;
  }
  private mustExperience(id: string) {
    const value = this.experiences.find((x) => x.id === id);
    if (!value)
      throw new DemoError("unknown_experience", `Unknown experience: ${id}`);
    return value;
  }
}
