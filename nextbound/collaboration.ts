import type {
  ArtifactContract,
  CollaborationDeclaration,
  Nextbound,
} from "./runtime.js";

export type VisualContribution = {
  participantId: string;
  sessionColor: string;
  typographyRole: "monospace-annotation" | "serif-italic" | "structural-sans";
  shapeLanguage: "precise-grid" | "organic-curves" | "decisive-groups";
  textureLanguage: "electric-lines" | "pastel-field" | "ivory-cobalt";
  motionSignature: "precise-linear" | "organic-drift" | "controlled-release";
  activeObjectIds: string[];
  contributionStrength: number;
};

export type SharedObject = {
  id: string;
  type: "trace" | "canvas-region" | "constraint";
  authorParticipantId: string;
  semanticLabel: string;
  geometry: { x: number; y: number; points: number[] };
  motionState: "linear" | "curved" | "released";
  revision: number;
};

export type CollaborativeEvent = {
  id: string;
  sequenceNumber: number;
  type:
    | "participant_arrived"
    | "object_authored"
    | "object_transformed"
    | "constraint_released"
    | "participant_left";
  participantId: string;
  objectId?: string;
  timestamp: string;
  semanticContribution?: "gesture" | "composition" | "constraint";
};

export type LocalVisualRecipe = Omit<
  VisualContribution,
  "participantId" | "activeObjectIds" | "contributionStrength"
> & {
  participantId: string;
};

export type CollaborativeVisualField = {
  compatibilityKey: string;
  localParticipantId: string;
  influence: Array<{ participantId: string; weight: number; live: boolean }>;
  palette: string[];
  typographyLayers: VisualContribution["typographyRole"][];
  shapeLayers: VisualContribution["shapeLanguage"][];
  textureLayers: VisualContribution["textureLanguage"][];
  motionBlend: VisualContribution["motionSignature"][];
  sharedObjects: SharedObject[];
  presenceMessages: string[];
  transitionPlan: Array<{
    participantId: string;
    originObjectId?: string;
    mode: "propagate" | "fade-presence";
  }>;
  fingerprint: string;
};

const stableHash = (value: unknown) => {
  let hash = 2166136261;
  for (const char of JSON.stringify(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export function contractsAreCompatible(
  a: ArtifactContract,
  b: ArtifactContract,
) {
  return Boolean(
    a.collaboration &&
    b.collaboration &&
    a.collaboration.compatibilityKey === b.collaboration.compatibilityKey,
  );
}

export function sanitizeVisualContribution(
  input: VisualContribution & Record<string, unknown>,
): VisualContribution {
  return {
    participantId: input.participantId,
    sessionColor: input.sessionColor,
    typographyRole: input.typographyRole,
    shapeLanguage: input.shapeLanguage,
    textureLanguage: input.textureLanguage,
    motionSignature: input.motionSignature,
    activeObjectIds: [...input.activeObjectIds],
    contributionStrength: Math.max(0, Math.min(1, input.contributionStrength)),
  };
}

export function resolveCollaborativeVisualField(input: {
  localVisualRecipe: LocalVisualRecipe;
  remoteVisualContributions: VisualContribution[];
  sharedObjects: SharedObject[];
  recentCollaborativeEvents: CollaborativeEvent[];
  contractPolicy: CollaborationDeclaration;
}): CollaborativeVisualField {
  const events = [...input.recentCollaborativeEvents].sort(
    (a, b) => a.sequenceNumber - b.sequenceNumber,
  );
  const lastSequence = events.at(-1)?.sequenceNumber ?? 0;
  const left = new Set(
    events
      .filter((event) => event.type === "participant_left")
      .map((event) => event.participantId),
  );
  const activeRemotes = input.remoteVisualContributions.map(
    sanitizeVisualContribution,
  );
  const scored = activeRemotes.map((contribution) => {
    const lastEvent = [...events]
      .reverse()
      .find((event) => event.participantId === contribution.participantId);
    const recency = lastEvent
      ? 1 / (1 + Math.max(0, lastSequence - lastEvent.sequenceNumber) * 0.2)
      : 0.5;
    const ownership = input.sharedObjects.filter(
      (object) => object.authorParticipantId === contribution.participantId,
    ).length;
    const live = !left.has(contribution.participantId);
    return {
      contribution,
      live,
      score:
        contribution.contributionStrength *
        recency *
        (1 + ownership * 0.12) *
        (live ? 1 : 0.18),
    };
  });
  const configuredLocal = Math.max(
    0.5,
    Math.min(0.8, input.contractPolicy.visualContributionPolicy.localDominance),
  );
  const remoteTotal = scored.reduce((sum, item) => sum + item.score, 0);
  const localWeight = remoteTotal ? configuredLocal : 1;
  const influence = [
    {
      participantId: input.localVisualRecipe.participantId,
      weight: localWeight,
      live: true,
    },
    ...scored.map((item) => ({
      participantId: item.contribution.participantId,
      weight: remoteTotal
        ? Number(((1 - localWeight) * (item.score / remoteTotal)).toFixed(4))
        : 0,
      live: item.live,
    })),
  ];
  const perceptible = scored
    .filter((item) => item.score > 0)
    .map((item) => item.contribution);
  const fieldBase = {
    compatibilityKey: input.contractPolicy.compatibilityKey,
    localParticipantId: input.localVisualRecipe.participantId,
    influence,
    palette: [
      input.localVisualRecipe.sessionColor,
      ...perceptible.map((item) => item.sessionColor),
    ],
    typographyLayers: [
      input.localVisualRecipe.typographyRole,
      ...perceptible.map((item) => item.typographyRole),
    ],
    shapeLayers: [
      input.localVisualRecipe.shapeLanguage,
      ...perceptible.map((item) => item.shapeLanguage),
    ],
    textureLayers: [
      input.localVisualRecipe.textureLanguage,
      ...perceptible.map((item) => item.textureLanguage),
    ],
    motionBlend: [
      input.localVisualRecipe.motionSignature,
      ...perceptible.map((item) => item.motionSignature),
    ],
    sharedObjects: structuredClone(input.sharedObjects),
    presenceMessages: scored
      .filter((item) => item.live)
      .map(
        (item) => `${item.contribution.participantId} is shaping the commons`,
      ),
    transitionPlan: scored.map((item) => ({
      participantId: item.contribution.participantId,
      originObjectId: item.contribution.activeObjectIds[0],
      mode: item.live ? ("propagate" as const) : ("fade-presence" as const),
    })),
  };
  return { ...fieldBase, fingerprint: `blend-${stableHash(fieldBase)}` };
}

export function privateShell(execution: {
  participantId: string;
  privateNextbounds: Nextbound[];
  privateGeneratedContent: unknown[];
}) {
  return structuredClone(execution);
}

export const commonsContributions: Record<string, VisualContribution> = {
  maya: {
    participantId: "maya",
    sessionColor: "#38d9ff",
    typographyRole: "monospace-annotation",
    shapeLanguage: "precise-grid",
    textureLanguage: "electric-lines",
    motionSignature: "precise-linear",
    activeObjectIds: ["snake-trace-maya"],
    contributionStrength: 0.92,
  },
  noa: {
    participantId: "noa",
    sessionColor: "#f3a7c8",
    typographyRole: "serif-italic",
    shapeLanguage: "organic-curves",
    textureLanguage: "pastel-field",
    motionSignature: "organic-drift",
    activeObjectIds: ["snake-trace-maya"],
    contributionStrength: 0.86,
  },
  elias: {
    participantId: "elias",
    sessionColor: "#3157c8",
    typographyRole: "structural-sans",
    shapeLanguage: "decisive-groups",
    textureLanguage: "ivory-cobalt",
    motionSignature: "controlled-release",
    activeObjectIds: ["snake-trace-maya"],
    contributionStrength: 0.78,
  },
};

export const commonsEvents: CollaborativeEvent[] = [
  {
    id: "ce-1",
    sequenceNumber: 1,
    type: "participant_arrived",
    participantId: "maya",
    timestamp: "2026-07-17T12:00:01.000Z",
  },
  {
    id: "ce-2",
    sequenceNumber: 2,
    type: "object_authored",
    participantId: "maya",
    objectId: "snake-trace-maya",
    timestamp: "2026-07-17T12:00:02.000Z",
    semanticContribution: "gesture",
  },
  {
    id: "ce-3",
    sequenceNumber: 3,
    type: "participant_arrived",
    participantId: "noa",
    timestamp: "2026-07-17T12:00:03.000Z",
  },
  {
    id: "ce-4",
    sequenceNumber: 4,
    type: "object_transformed",
    participantId: "noa",
    objectId: "snake-trace-maya",
    timestamp: "2026-07-17T12:00:04.000Z",
    semanticContribution: "composition",
  },
  {
    id: "ce-5",
    sequenceNumber: 5,
    type: "participant_arrived",
    participantId: "elias",
    timestamp: "2026-07-17T12:00:05.000Z",
  },
  {
    id: "ce-6",
    sequenceNumber: 6,
    type: "constraint_released",
    participantId: "elias",
    objectId: "snake-trace-maya",
    timestamp: "2026-07-17T12:00:06.000Z",
    semanticContribution: "constraint",
  },
];

export const commonsObject: SharedObject = {
  id: "snake-trace-maya",
  type: "trace",
  authorParticipantId: "maya",
  semanticLabel: "Maya's AFTERLIGHT snake trace",
  geometry: { x: 22, y: 38, points: [0, 8, 18, 24, 34, 20] },
  motionState: "released",
  revision: 3,
};
