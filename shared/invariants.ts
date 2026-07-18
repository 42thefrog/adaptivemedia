import type { Intent, PersonalizedExperience } from "./schemas.js";

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Cross-entity policy checks that cannot be expressed by either Zod schema alone. */
export function assertPersonalizationPolicy(
  intent: Intent,
  experience: PersonalizedExperience,
): void {
  if (
    experience.intentId !== intent.id ||
    experience.creatorId !== intent.creatorId
  ) {
    throw new Error(
      "Personalized output must reference its source Intent and creator",
    );
  }
  if (experience.sourceIntentVersion !== intent.version) {
    throw new Error(
      "Personalized output must reference the exact source Intent version",
    );
  }
  if (
    !sameJson(experience.preservedImmutableMessage, intent.immutableMessage)
  ) {
    throw new Error("immutableMessage must be preserved verbatim");
  }

  const adaptableKeys = Object.keys(experience.adaptableContent).filter(
    (key) => key !== "personalizationReasons",
  );
  const allowed = new Set(intent.adaptationRules.allowedVariables);
  const deniedKey = adaptableKeys.find((key) => !allowed.has(key));
  if (deniedKey)
    throw new Error(`Adaptation variable is not allowed: ${deniedKey}`);

  for (const recommendation of experience.commercialRecommendations) {
    const partner = intent.approvedPartners.find(
      (candidate) => candidate.name === recommendation.partnerName,
    );
    if (!partner)
      throw new Error(
        `Commercial partner is not approved: ${recommendation.partnerName}`,
      );
    if (
      recommendation.disclosure !== partner.disclosure ||
      recommendation.url !== partner.url
    ) {
      throw new Error(
        `Commercial disclosure and URL must match the approved partner: ${partner.name}`,
      );
    }
  }
}
