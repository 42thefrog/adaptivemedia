export type PersonalizationMode = "shared_form" | "shared_content";
export type NextboundDestinationType =
  "artifact_contract" | "frame" | "tool" | "experience" | "external";

export type Campaign = {
  id: string;
  creatorId: string;
  initialContractId: string;
  recipientIds: string[];
  createdAt: string;
};

export type Seed = {
  id: string;
  campaignId: string;
  contractId: string;
  recipientId: string;
  deliveredAt: string;
  openedAt?: string;
};

export type FrameSchema = {
  id: string;
  slot: string;
  type: "hero" | "content" | "prototype" | "opportunity" | "path";
};
export type ComponentSlot = { id: string; accepts: string[] };
export type InteractionSlot = { id: string; actions: string[] };
export type ContentBlock = {
  id: string;
  slotId: string;
  text: string;
  locked?: boolean;
};
export type OpportunityRule = {
  id: string;
  topic: string;
  minimumScore: number;
};

export type CollaborationDeclaration = {
  collaborationProtocolId: string;
  compatibilityKey: string;
  sharedStateSchema: {
    allowedObjectTypes: string[];
    allowedEventTypes: string[];
    semanticContributionKinds: string[];
  };
  visualContributionPolicy: {
    allowedTokenFields: string[];
    localDominance: number;
    preserveAuthoredObjectsOnLeave: boolean;
  };
};

export type ArtifactContract = {
  id: string;
  creatorId: string;
  version: string;
  title: string;
  personalizationMode: PersonalizationMode;
  invariants: {
    creatorIntent: string;
    requiredIdeas: string[];
    prohibitedTransformations: string[];
  };
  sharedForm?: {
    frameSchema: FrameSchema[];
    componentSlots: ComponentSlot[];
    interactionSlots: InteractionSlot[];
    narrativeRhythm: string[];
  };
  sharedContent?: {
    blocks: ContentBlock[];
    lockedBlockIds: string[];
  };
  contextPolicy: {
    allowedOkfScopes: string[];
    sessionContextAllowed: boolean;
    recentActivityAllowed: boolean;
    interactionLogAllowed: boolean;
  };
  generationPolicy: { mutableFields: string[]; outputSchema: string };
  nextboundPolicy: {
    allowedDestinationTypes: NextboundDestinationType[];
    maximumVisibleNextbounds: number;
    opportunityRules: OpportunityRule[];
  };
  toolPolicy: { allowedTools: string[] };
  collaboration?: CollaborationDeclaration;
};

export type Presentation = {
  accent: string;
  background: string;
  typography: "mono" | "editorial" | "humanist";
  density: "compact" | "balanced" | "immersive";
  layout: "grid" | "stack" | "collage";
};
export type ActivatedAnchor = {
  id: string;
  blockId: string;
  phrase: string;
  nextboundId: string;
  style: string;
};
export type Interaction = {
  id: string;
  type: InteractionActionType;
  label: string;
  targetId?: string;
};
export type OpportunityState = {
  id: string;
  availableSlots: number;
  expiresAt: string;
  status: "available" | "claimed" | "expired" | "unavailable";
  claimedBy?: string;
};
export type Frame = {
  id: string;
  schemaId: string;
  placement: "append" | "insert_after" | "focus" | "replace" | "navigate";
  insertAfterFrameId?: string;
  blocks: ContentBlock[];
  highlighted: boolean;
};

export function applyFramePlacement(
  frames: Frame[],
  frame: Frame,
  targetFrameId?: string,
): Frame[] {
  const current = structuredClone(frames);
  if (frame.placement === "navigate") return [structuredClone(frame)];
  if (frame.placement === "append") return [...current, structuredClone(frame)];
  const targetIndex = current.findIndex((item) => item.id === targetFrameId);
  if (frame.placement === "replace") {
    if (targetIndex < 0) throw new Error("Replacement frame target not found.");
    current.splice(targetIndex, 1, structuredClone(frame));
    return current;
  }
  if (frame.placement === "insert_after") {
    if (targetIndex < 0) throw new Error("Insertion frame target not found.");
    current.splice(targetIndex + 1, 0, structuredClone(frame));
    return current;
  }
  return current.map((item) => ({
    ...item,
    highlighted: item.id === frame.id,
  }));
}

export type Nextbound = {
  id: string;
  sourceContractId: string;
  sourceExecutionId: string;
  trigger: {
    type: "word" | "phrase" | "component" | "action" | "opportunity";
    anchor?: string;
  };
  semanticReason: string;
  relevanceScore: number;
  destination: { type: NextboundDestinationType; targetId: string };
  presentation: { label?: string; highlightStyle?: string };
  availability: {
    status: "available" | "claimed" | "expired" | "unavailable";
    expiresAt?: string;
  };
  explainability: {
    okfContribution: number;
    liveSessionContribution: number;
    supportingObservationIds: string[];
    reason: string;
  };
};

export type ArtifactExecution = {
  id: string;
  contractId: string;
  contractVersion: string;
  sessionId: string;
  visitId: string;
  visitNumber: number;
  pathFingerprint: string;
  generatedContent: ContentBlock[];
  resolvedPresentation: Presentation;
  activatedAnchors: ActivatedAnchor[];
  resolvedNextbounds: Nextbound[];
  availableInteractions: Interaction[];
  opportunityStates: OpportunityState[];
  frames: Frame[];
  contextTrace: {
    okfContribution: number;
    sessionContribution: number;
    supportingObservationIds: string[];
  };
  complianceTrace: {
    preservedInvariantIds: string[];
    appliedRuleIds: string[];
    violations: string[];
  };
  createdAt: string;
};

export type InteractionActionType =
  | "artifact_viewed"
  | "frame_viewed"
  | "word_activated"
  | "nextbound_opened"
  | "action_clicked"
  | "opportunity_claimed"
  | "opportunity_ignored"
  | "frame_dismissed"
  | "navigation_returned";

export type InteractionEvent = {
  id: string;
  sessionId: string;
  sequenceNumber: number;
  timestamp: string;
  contractId: string;
  executionId: string;
  frameId?: string;
  actionType: InteractionActionType;
  targetId?: string;
  nextboundId?: string;
  dwellTimeMs?: number;
  metadata: Record<string, unknown>;
};

export type SemanticObservation = {
  id: string;
  sourceEventIds: string[];
  interpretation: string;
  topics: string[];
  inferredIntent: string;
  polarity: number;
  confidence: number;
  strength: number;
  createdAt: string;
};

export type LiveSessionContext = {
  dominantTopics: string[];
  inferredIntent: string;
  engagementScore: number;
  lastMeaningfulAction?: string;
};
export type ArtifactExecutionReference = {
  executionId: string;
  contractId: string;
  visitId: string;
  visitNumber: number;
  pathFingerprint: string;
};
export type ExperienceSession = {
  id: string;
  seedId: string;
  recipientId: string;
  status: "active" | "paused" | "stopped";
  currentExecutionId: string;
  executionHistory: ArtifactExecutionReference[];
  interactionLog: InteractionEvent[];
  semanticScratchpad: SemanticObservation[];
  liveContext: LiveSessionContext;
  contextWeights: { knowledgeBase: number; liveSession: number };
  sequenceCounter: number;
};

export type OkfContext = {
  recipientId: string;
  scopes: Record<string, string[]>;
};
export type ComposedRecipientContext = {
  recipientId: string;
  knowledgeSignals: string[];
  liveSignals: Array<{ topic: string; score: number }>;
  dominantIntent: string;
  weights: { knowledgeBase: number; liveSession: number };
  supportingObservationIds: string[];
};
export type ArtifactMutation = {
  type:
    | "update_content"
    | "update_presentation"
    | "activate_anchor"
    | "deactivate_anchor"
    | "add_nextbound"
    | "replace_nextbound"
    | "remove_nextbound"
    | "insert_frame"
    | "replace_frame"
    | "add_opportunity"
    | "remove_opportunity"
    | "navigate_to_contract";
  targetId: string;
  reason: string;
};

const basePolicy = {
  contextPolicy: {
    allowedOkfScopes: ["knowledge", "preferences"],
    sessionContextAllowed: true,
    recentActivityAllowed: true,
    interactionLogAllowed: true,
  },
  generationPolicy: {
    mutableFields: ["content", "presentation", "anchors", "nextbounds"],
    outputSchema: "nextbound.artifact-execution.v1",
  },
  nextboundPolicy: {
    allowedDestinationTypes: [
      "artifact_contract",
      "frame",
      "tool",
      "experience",
    ] as NextboundDestinationType[],
    maximumVisibleNextbounds: 4,
    opportunityRules: [
      { id: "multiplayer-slot", topic: "multiplayer", minimumScore: 0.55 },
    ],
  },
  toolPolicy: { allowedTools: ["visual-builder", "prototype-lab"] },
};

const lockedAfterlight: ContentBlock[] = [
  {
    id: "creator-intent",
    slotId: "hero",
    text: "What we remember is not what happened. It is what the moment became inside us.",
    locked: true,
  },
];

export const afterlightCommonsPolicy: CollaborationDeclaration = {
  collaborationProtocolId: "nextbound-collaboration-v1",
  compatibilityKey: "afterlight-commons-v1",
  sharedStateSchema: {
    allowedObjectTypes: ["trace", "canvas-region", "constraint"],
    allowedEventTypes: [
      "participant_arrived",
      "object_authored",
      "object_transformed",
      "constraint_released",
      "participant_left",
    ],
    semanticContributionKinds: ["gesture", "composition", "constraint"],
  },
  visualContributionPolicy: {
    allowedTokenFields: [
      "sessionColor",
      "typographyRole",
      "shapeLanguage",
      "textureLanguage",
      "motionSignature",
      "activeObjectIds",
      "contributionStrength",
    ],
    localDominance: 0.6,
    preserveAuthoredObjectsOnLeave: true,
  },
};

export const continuousContracts: Record<string, ArtifactContract> = {
  "visual-lab": {
    id: "visual-lab",
    creatorId: "luna-vale",
    version: "2.0.0",
    title: "AFTERLIGHT / Visual Lab",
    personalizationMode: "shared_content",
    invariants: {
      creatorIntent: "Turn one memory into a world that can keep evolving.",
      requiredIdeas: ["memory", "transformation", "attribution"],
      prohibitedTransformations: [
        "remove_creator_attribution",
        "rewrite_locked_content",
      ],
    },
    sharedContent: {
      blocks: lockedAfterlight,
      lockedBlockIds: ["creator-intent"],
    },
    ...structuredClone(basePolicy),
  },
  "technical-prototype": {
    id: "technical-prototype",
    creatorId: "luna-vale",
    version: "1.0.0",
    title: "Technical Prototype",
    personalizationMode: "shared_form",
    invariants: {
      creatorIntent:
        "Let the audience build a working interpretation of the memory.",
      requiredIdeas: ["prototype", "system", "memory"],
      prohibitedTransformations: ["finished_product_claim"],
    },
    sharedForm: {
      frameSchema: [
        { id: "prototype-hero", slot: "hero", type: "hero" },
        { id: "prototype-workbench", slot: "workbench", type: "prototype" },
      ],
      componentSlots: [
        { id: "hero", accepts: ["text"] },
        { id: "workbench", accepts: ["text", "code"] },
      ],
      interactionSlots: [
        { id: "prototype-actions", actions: ["action_clicked"] },
      ],
      narrativeRhythm: ["observe", "build", "invite"],
    },
    ...structuredClone(basePolicy),
  },
  "multiplayer-snake": {
    id: "multiplayer-snake",
    creatorId: "nextbound-labs",
    version: "1.0.0",
    title: "Multiplayer Snake Lobby",
    personalizationMode: "shared_form",
    invariants: {
      creatorIntent: "Test collective participation through a simulated lobby.",
      requiredIdeas: ["multiplayer", "participation", "prototype"],
      prohibitedTransformations: ["real_game_claim"],
    },
    sharedForm: {
      frameSchema: [
        { id: "lobby", slot: "lobby", type: "opportunity" },
        { id: "community", slot: "community", type: "content" },
      ],
      componentSlots: [
        { id: "lobby", accepts: ["opportunity"] },
        { id: "community", accepts: ["text"] },
      ],
      interactionSlots: [{ id: "claim", actions: ["opportunity_claimed"] }],
      narrativeRhythm: ["invite", "claim", "collaborate"],
    },
    ...structuredClone(basePolicy),
    collaboration: structuredClone(afterlightCommonsPolicy),
  },
  "collaborative-artifact": {
    id: "collaborative-artifact",
    creatorId: "nextbound-community",
    version: "1.0.0",
    title: "Collaborative Artifact",
    personalizationMode: "shared_form",
    invariants: {
      creatorIntent: "Turn individual choices into a collective visual trace.",
      requiredIdeas: ["collective", "visual", "memory"],
      prohibitedTransformations: ["erase_contributors"],
    },
    sharedForm: {
      frameSchema: [
        { id: "collective-hero", slot: "hero", type: "hero" },
        { id: "collective-path", slot: "path", type: "path" },
      ],
      componentSlots: [
        { id: "hero", accepts: ["text"] },
        { id: "path", accepts: ["text"] },
      ],
      interactionSlots: [{ id: "return", actions: ["navigation_returned"] }],
      narrativeRhythm: ["collect", "reflect", "return"],
    },
    ...structuredClone(basePolicy),
  },
  "living-canvas": {
    id: "living-canvas",
    creatorId: "noa-studio",
    version: "1.0.0",
    title: "Living Canvas",
    personalizationMode: "shared_form",
    invariants: {
      creatorIntent: "Let shared traces become an evolving visual composition.",
      requiredIdeas: ["shared trace", "transformation", "attribution"],
      prohibitedTransformations: ["erase_contributors"],
    },
    sharedForm: {
      frameSchema: [{ id: "canvas", slot: "canvas", type: "content" }],
      componentSlots: [{ id: "canvas", accepts: ["shared-object"] }],
      interactionSlots: [{ id: "transform", actions: ["action_clicked"] }],
      narrativeRhythm: ["receive", "shape", "return"],
    },
    ...structuredClone(basePolicy),
    collaboration: structuredClone(afterlightCommonsPolicy),
  },
  "constraint-room": {
    id: "constraint-room",
    creatorId: "elias-north",
    version: "1.0.0",
    title: "Constraint Room",
    personalizationMode: "shared_form",
    invariants: {
      creatorIntent: "Change composition by releasing explicit constraints.",
      requiredIdeas: ["constraint", "movement", "shared object"],
      prohibitedTransformations: ["erase_contributors"],
    },
    sharedForm: {
      frameSchema: [{ id: "room", slot: "room", type: "content" }],
      componentSlots: [
        { id: "room", accepts: ["constraint", "shared-object"] },
      ],
      interactionSlots: [{ id: "release", actions: ["action_clicked"] }],
      narrativeRhythm: ["bound", "release", "recompose"],
    },
    ...structuredClone(basePolicy),
    collaboration: structuredClone(afterlightCommonsPolicy),
  },
};

export const loopCampaign: Campaign = {
  id: "campaign-afterlight-runtime",
  creatorId: "luna-vale",
  initialContractId: "visual-lab",
  recipientIds: ["maya", "camille", "alex"],
  createdAt: "2026-07-17T10:00:00.000Z",
};
export const loopSeeds: Seed[] = loopCampaign.recipientIds.map(
  (recipientId, index) => ({
    id: `seed-afterlight-${recipientId}`,
    campaignId: loopCampaign.id,
    contractId: loopCampaign.initialContractId,
    recipientId,
    deliveredAt: `2026-07-17T10:0${index}:00.000Z`,
  }),
);

export const runtimeOkf: Record<string, OkfContext> = {
  maya: {
    recipientId: "maya",
    scopes: {
      knowledge: [
        "technical experimentation",
        "prototyping",
        "AI tools",
        "building",
      ],
      preferences: ["interactive", "technical", "visual"],
    },
  },
  camille: {
    recipientId: "camille",
    scopes: {
      knowledge: ["aesthetic direction", "architecture", "editorial systems"],
      preferences: ["editorial", "minimal", "visual"],
    },
  },
  alex: {
    recipientId: "alex",
    scopes: {
      knowledge: ["creator communities", "collaboration", "participation"],
      preferences: ["social", "expressive", "shared"],
    },
  },
};

const hash = (value: string) => {
  let state = 2166136261;
  for (const character of value) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return (state >>> 0).toString(16).padStart(8, "0");
};
const deterministicTime = (sequence: number) =>
  new Date(Date.UTC(2026, 6, 17, 12, 0, sequence)).toISOString();

export function pathFingerprint(
  interactionLog: InteractionEvent[],
  history: ArtifactExecutionReference[],
) {
  const ordered = interactionLog
    .map(
      (event) =>
        `${event.sequenceNumber}:${event.actionType}:${event.targetId ?? ""}:${event.nextboundId ?? ""}`,
    )
    .join("|");
  const visits = history
    .map((reference) => `${reference.contractId}:${reference.visitNumber}`)
    .join("|");
  return `path-${hash(`${visits}::${ordered}`)}`;
}

export function appendInteractionEvent(
  session: ExperienceSession,
  input: Omit<
    InteractionEvent,
    | "id"
    | "sessionId"
    | "sequenceNumber"
    | "timestamp"
    | "contractId"
    | "executionId"
  >,
  current: ArtifactExecution,
) {
  const sequenceNumber = session.sequenceCounter + 1;
  const event: InteractionEvent = {
    ...structuredClone(input),
    id: `event-${session.id}-${sequenceNumber}`,
    sessionId: session.id,
    sequenceNumber,
    timestamp: deterministicTime(sequenceNumber),
    contractId: current.contractId,
    executionId: current.id,
  };
  session.sequenceCounter = sequenceNumber;
  session.interactionLog.push(event);
  return event;
}

const actionStrength: Record<InteractionActionType, number> = {
  artifact_viewed: 0.15,
  frame_viewed: 0.2,
  word_activated: 0.7,
  nextbound_opened: 0.9,
  action_clicked: 0.82,
  opportunity_claimed: 1,
  opportunity_ignored: -0.65,
  frame_dismissed: -0.45,
  navigation_returned: 0.95,
};

export function deriveSemanticObservation(
  event: InteractionEvent,
): SemanticObservation {
  const topic = String(
    event.metadata.topic ??
      event.targetId ??
      event.nextboundId ??
      event.actionType,
  );
  const intent =
    event.actionType === "opportunity_claimed"
      ? "participate"
      : event.actionType === "navigation_returned"
        ? "integrate"
        : event.actionType.includes("viewed")
          ? "observe"
          : "explore";
  const strength = Math.abs(actionStrength[event.actionType]);
  return {
    id: `observation-${event.id}`,
    sourceEventIds: [event.id],
    interpretation:
      event.actionType === "opportunity_claimed"
        ? "The user currently prefers participatory technical experiences."
        : `The ordered action ${event.actionType} increased the relevance of ${topic}.`,
    topics: [topic],
    inferredIntent: intent,
    polarity: actionStrength[event.actionType] < 0 ? -1 : 1,
    confidence: Number((0.55 + strength * 0.4).toFixed(2)),
    strength,
    createdAt: event.timestamp,
  };
}

export function updateSemanticScratchpad(
  session: ExperienceSession,
  event: InteractionEvent,
) {
  const observation = deriveSemanticObservation(event);
  session.semanticScratchpad.push(observation);
  return observation;
}

export function composeRecipientContext(input: {
  okfContext: OkfContext;
  semanticScratchpad: SemanticObservation[];
  interactionLog: InteractionEvent[];
  contextWeights: { knowledgeBase: number; liveSession: number };
}): ComposedRecipientContext {
  const { contextWeights } = input;
  if (
    Math.abs(contextWeights.knowledgeBase + contextWeights.liveSession - 1) >
    0.0001
  )
    throw new Error("Context weights must sum to 1.");
  const allowedSignals = Object.values(input.okfContext.scopes).flat();
  const liveScores = new Map<string, number>();
  input.semanticScratchpad.forEach((observation, index) => {
    const recency =
      1 / (1 + (input.semanticScratchpad.length - 1 - index) * 0.18);
    const repeated =
      1 +
      observation.topics.filter((topic) => liveScores.has(topic)).length * 0.12;
    for (const topic of observation.topics) {
      const score =
        observation.strength *
        observation.confidence *
        observation.polarity *
        recency *
        repeated;
      liveScores.set(topic, (liveScores.get(topic) ?? 0) + score);
    }
  });
  const liveSignals = [...liveScores]
    .map(([topic, score]) => ({ topic, score: Number(score.toFixed(3)) }))
    .sort((a, b) => b.score - a.score);
  return {
    recipientId: input.okfContext.recipientId,
    knowledgeSignals: allowedSignals,
    liveSignals,
    dominantIntent:
      input.semanticScratchpad.at(-1)?.inferredIntent ?? "explore",
    weights: structuredClone(contextWeights),
    supportingObservationIds: input.semanticScratchpad
      .slice(-5)
      .map((item) => item.id),
  };
}

const presentationFor = (
  contract: ArtifactContract,
  context: ComposedRecipientContext,
  visitNumber: number,
): Presentation => {
  const collaborative = context.liveSignals.some(
    (signal) =>
      ["multiplayer", "collaborative", "collective"].some((topic) =>
        signal.topic.includes(topic),
      ) && signal.score > 0.5,
  );
  if (collaborative && contract.id === "visual-lab" && visitNumber > 1)
    return {
      accent: "#72f0c2",
      background: "#071b19",
      typography: "humanist",
      density: "immersive",
      layout: "collage",
    };
  if (context.knowledgeSignals.some((signal) => signal.includes("aesthetic")))
    return {
      accent: "#d8c6a3",
      background: "#e9e2d6",
      typography: "editorial",
      density: "balanced",
      layout: "stack",
    };
  return {
    accent: "#38a8ff",
    background: "#061323",
    typography: "mono",
    density: "compact",
    layout: "grid",
  };
};

const contentFor = (
  contract: ArtifactContract,
  context: ComposedRecipientContext,
  visitNumber: number,
): ContentBlock[] => {
  if (contract.personalizationMode === "shared_content")
    return structuredClone(contract.sharedContent!.blocks);
  const collaborative = context.liveSignals.some(
    (signal) =>
      ["multiplayer", "collaborative", "collective"].some((topic) =>
        signal.topic.includes(topic),
      ) && signal.score > 0.5,
  );
  const subject = collaborative
    ? "Collective participation reshapes the memory system."
    : context.knowledgeSignals.slice(0, 2).join(" and ");
  return contract.sharedForm!.frameSchema.map((frame, index) => ({
    id: `${contract.id}-generated-${frame.id}`,
    slotId: frame.slot,
    text:
      index === 0
        ? `${contract.title}: ${subject}`
        : `Visit ${visitNumber} · ${frame.type} · ${context.dominantIntent}`,
  }));
};

const nextboundDrafts: Record<
  string,
  Array<{
    id: string;
    label: string;
    anchor: string;
    targetId: string;
    reason: string;
    type?: Nextbound["trigger"]["type"];
  }>
> = {
  "visual-lab": [
    {
      id: "open-technical-prototype",
      label: "Build the technical prototype",
      anchor: "prototype",
      targetId: "technical-prototype",
      reason:
        "Technical OKF signals make building the strongest first continuation.",
    },
    {
      id: "open-collaborative-visual",
      label: "Continue the collective visual",
      anchor: "together",
      targetId: "collaborative-artifact",
      reason:
        "Recent multiplayer participation now outweighs the historical technical prediction.",
    },
    {
      id: "open-editorial-composition",
      label: "Compose the editorial memory",
      anchor: "memory",
      targetId: "technical-prototype",
      reason:
        "Aesthetic and editorial OKF signals activate composition inside the locked text.",
    },
  ],
  "technical-prototype": [
    {
      id: "open-multiplayer-snake",
      label: "Open the Multiplayer Snake opportunity",
      anchor: "multiplayer",
      targetId: "multiplayer-snake",
      reason:
        "Prototype and participation signals make the simulated multiplayer lobby relevant.",
      type: "opportunity",
    },
  ],
  "multiplayer-snake": [
    {
      id: "claim-multiplayer-slot",
      label: "Claim the final collaborative slot",
      anchor: "join",
      targetId: "collaborative-artifact",
      reason: "An ephemeral slot is available for this active session.",
      type: "opportunity",
    },
  ],
  "collaborative-artifact": [
    {
      id: "return-visual-lab-runtime",
      label: "Return to Visual Lab",
      anchor: "return",
      targetId: "visual-lab",
      reason:
        "The collective artifact completes the loop back to the stable creator contract.",
    },
  ],
};

export function resolveNextbounds(input: {
  contract: ArtifactContract;
  executionDraft: Pick<ArtifactExecution, "id" | "visitNumber">;
  composedContext: ComposedRecipientContext;
  sessionState: ExperienceSession;
  opportunityState: OpportunityState;
}): Nextbound[] {
  let drafts = nextboundDrafts[input.contract.id] ?? [];
  if (input.contract.id === "visual-lab") {
    const collective = input.composedContext.liveSignals.some(
      (signal) =>
        ["multiplayer", "collaborative", "collective"].some((topic) =>
          signal.topic.includes(topic),
        ) && signal.score > 0.5,
    );
    const editorial = input.composedContext.knowledgeSignals.some((signal) =>
      ["aesthetic", "editorial"].some((topic) => signal.includes(topic)),
    );
    drafts = [drafts[collective ? 1 : editorial ? 2 : 0]];
  }
  return drafts
    .filter(Boolean)
    .slice(0, input.contract.nextboundPolicy.maximumVisibleNextbounds)
    .map((draft, index) => {
      const unavailable =
        draft.id === "claim-multiplayer-slot" &&
        input.opportunityState.status !== "available" &&
        input.opportunityState.claimedBy !== input.sessionState.id;
      return {
        id: draft.id,
        sourceContractId: input.contract.id,
        sourceExecutionId: input.executionDraft.id,
        trigger: {
          type: draft.type ?? "phrase",
          anchor: draft.anchor,
        },
        semanticReason: draft.reason,
        relevanceScore: Number((0.94 - index * 0.07).toFixed(2)),
        destination: { type: "artifact_contract", targetId: draft.targetId },
        presentation: {
          label: draft.label,
          highlightStyle: index === 0 ? "pulse" : "underline",
        },
        availability: {
          status: unavailable ? "unavailable" : "available",
          expiresAt:
            draft.type === "opportunity"
              ? input.opportunityState.expiresAt
              : undefined,
        },
        explainability: {
          okfContribution: input.composedContext.weights.knowledgeBase,
          liveSessionContribution: input.composedContext.weights.liveSession,
          supportingObservationIds:
            input.composedContext.supportingObservationIds,
          reason: draft.reason,
        },
      } satisfies Nextbound;
    });
}

export function validateArtifactExecution(
  contract: ArtifactContract,
  execution: ArtifactExecution,
) {
  const violations: string[] = [];
  if (
    execution.contractId !== contract.id ||
    execution.contractVersion !== contract.version
  )
    violations.push("contract_identity_changed");
  if (contract.personalizationMode === "shared_content") {
    for (const lockedId of contract.sharedContent!.lockedBlockIds) {
      const source = contract.sharedContent!.blocks.find(
        (block) => block.id === lockedId,
      );
      const generated = execution.generatedContent.find(
        (block) => block.id === lockedId,
      );
      if (!source || !generated || source.text !== generated.text)
        violations.push(`locked_content_changed:${lockedId}`);
    }
  } else {
    const schemaSlots = contract.sharedForm!.frameSchema.map(
      (frame) => frame.slot,
    );
    if (
      !schemaSlots.every((slot) =>
        execution.generatedContent.some((block) => block.slotId === slot),
      )
    )
      violations.push("shared_form_schema_mismatch");
  }
  if (
    execution.resolvedNextbounds.some(
      (nextbound) =>
        !contract.nextboundPolicy.allowedDestinationTypes.includes(
          nextbound.destination.type,
        ),
    )
  )
    violations.push("destination_type_not_allowed");
  if (
    execution.generatedContent.some((block) => /https?:\/\//i.test(block.text))
  )
    violations.push("static_href_in_content");
  for (const idea of contract.invariants.requiredIdeas) {
    if (
      !execution.complianceTrace.preservedInvariantIds.includes(
        `required:${idea}`,
      )
    )
      violations.push(`required_idea_unverified:${idea}`);
  }
  if (
    !execution.complianceTrace.appliedRuleIds.includes(
      `schema:${contract.generationPolicy.outputSchema}`,
    )
  )
    violations.push("output_schema_unverified");
  for (const nextbound of execution.resolvedNextbounds) {
    if (
      nextbound.destination.type === "tool" &&
      !contract.toolPolicy.allowedTools.includes(nextbound.destination.targetId)
    )
      violations.push(`tool_not_permitted:${nextbound.destination.targetId}`);
  }
  execution.complianceTrace.violations = violations;
  if (violations.length)
    throw new Error(`Invalid ArtifactExecution: ${violations.join(", ")}`);
  return execution;
}

export function executeArtifactContract(input: {
  contract: ArtifactContract;
  okfContext: OkfContext;
  sessionState: ExperienceSession;
  pathFingerprint: string;
  opportunityState: OpportunityState;
}): ArtifactExecution {
  const allowedScopes = new Set(input.contract.contextPolicy.allowedOkfScopes);
  const prohibited = Object.keys(input.okfContext.scopes).filter(
    (scope) => !allowedScopes.has(scope),
  );
  if (prohibited.length)
    throw new Error(`Prohibited OKF scopes: ${prohibited.join(", ")}`);
  const composedContext = composeRecipientContext({
    okfContext: input.okfContext,
    semanticScratchpad: input.sessionState.semanticScratchpad,
    interactionLog: input.sessionState.interactionLog,
    contextWeights: input.sessionState.contextWeights,
  });
  const previousForContract = input.sessionState.executionHistory.filter(
    (reference) => reference.contractId === input.contract.id,
  );
  const currentReference = input.sessionState.executionHistory.at(-1);
  const visitNumber =
    currentReference?.contractId === input.contract.id
      ? currentReference.visitNumber
      : (previousForContract.at(-1)?.visitNumber ?? 0) + 1;
  const executionIndex = input.sessionState.executionHistory.length + 1;
  const id = `execution-${input.contract.id}-${executionIndex}-${input.pathFingerprint.slice(-6)}`;
  const generatedContent = contentFor(
    input.contract,
    composedContext,
    visitNumber,
  );
  const draft = { id, visitNumber };
  const resolvedNextbounds = resolveNextbounds({
    contract: input.contract,
    executionDraft: draft,
    composedContext,
    sessionState: input.sessionState,
    opportunityState: input.opportunityState,
  });
  const execution: ArtifactExecution = {
    id,
    contractId: input.contract.id,
    contractVersion: input.contract.version,
    sessionId: input.sessionState.id,
    visitId: `visit-${input.contract.id}-${visitNumber}`,
    visitNumber,
    pathFingerprint: input.pathFingerprint,
    generatedContent,
    resolvedPresentation: presentationFor(
      input.contract,
      composedContext,
      visitNumber,
    ),
    activatedAnchors: resolvedNextbounds.map((nextbound) => ({
      id: `anchor-${nextbound.id}`,
      blockId: generatedContent[0]?.id ?? "generated",
      phrase:
        nextbound.trigger.anchor ??
        nextbound.presentation.label ??
        nextbound.id,
      nextboundId: nextbound.id,
      style: nextbound.presentation.highlightStyle ?? "underline",
    })),
    resolvedNextbounds,
    availableInteractions: resolvedNextbounds.map((nextbound) => ({
      id: `interaction-${nextbound.id}`,
      type:
        nextbound.trigger.type === "opportunity"
          ? "opportunity_claimed"
          : nextbound.id.includes("return")
            ? "navigation_returned"
            : "nextbound_opened",
      label: nextbound.presentation.label ?? nextbound.id,
      targetId: nextbound.destination.targetId,
    })),
    opportunityStates:
      input.contract.id === "multiplayer-snake"
        ? [structuredClone(input.opportunityState)]
        : [],
    frames: generatedContent.map((block, index) => ({
      id: `frame-${id}-${index + 1}`,
      schemaId:
        input.contract.sharedForm?.frameSchema[index]?.id ?? block.slotId,
      placement: index === 0 ? "focus" : "insert_after",
      insertAfterFrameId: index > 0 ? `frame-${id}-${index}` : undefined,
      blocks: [structuredClone(block)],
      highlighted: index > 0,
    })),
    contextTrace: {
      okfContribution: composedContext.weights.knowledgeBase,
      sessionContribution: composedContext.weights.liveSession,
      supportingObservationIds: composedContext.supportingObservationIds,
    },
    complianceTrace: {
      preservedInvariantIds: [
        "creatorIntent",
        ...input.contract.invariants.requiredIdeas.map(
          (idea) => `required:${idea}`,
        ),
      ],
      appliedRuleIds: [
        `mode:${input.contract.personalizationMode}`,
        `schema:${input.contract.generationPolicy.outputSchema}`,
        "context:weighted-40-60",
        "nextbounds:semantic-first",
      ],
      violations: [],
    },
    createdAt: deterministicTime(executionIndex),
  };
  return validateArtifactExecution(input.contract, execution);
}

export class ContinuousProceduralRuntime {
  private sessions = new Map<string, ExperienceSession>();
  private executions = new Map<string, ArtifactExecution>();
  private seeds = new Map(
    loopSeeds.map((seed) => [seed.id, structuredClone(seed)]),
  );
  private opportunity: OpportunityState = {
    id: "multiplayer-final-slot",
    availableSlots: 1,
    expiresAt: "2026-07-17T18:00:00.000Z",
    status: "available",
  };

  hasSession(sessionId: string) {
    return this.sessions.has(sessionId);
  }

  getCampaign() {
    return structuredClone(loopCampaign);
  }
  getSeed(seedId: string) {
    const seed = this.seeds.get(seedId);
    if (!seed) throw new Error("Seed not found.");
    return structuredClone(seed);
  }
  openSeed(seedId: string, recipientId: string) {
    const seed = this.seeds.get(seedId);
    if (!seed || seed.recipientId !== recipientId)
      throw new Error("Seed is not available.");
    seed.openedAt = deterministicTime(0);
    const session: ExperienceSession = {
      id: `runtime-session-${recipientId}`,
      seedId,
      recipientId,
      status: "active",
      currentExecutionId: "",
      executionHistory: [],
      interactionLog: [],
      semanticScratchpad: [],
      liveContext: {
        dominantTopics: [],
        inferredIntent: "explore",
        engagementScore: 0,
      },
      contextWeights: { knowledgeBase: 0.4, liveSession: 0.6 },
      sequenceCounter: 0,
    };
    this.sessions.set(session.id, session);
    const execution = this.execute(seed.contractId, session);
    const viewed = appendInteractionEvent(
      session,
      { actionType: "artifact_viewed", metadata: { topic: "afterlight" } },
      execution,
    );
    updateSemanticScratchpad(session, viewed);
    return {
      seed: structuredClone(seed),
      session: structuredClone(session),
      execution,
    };
  }
  executeArtifactContract(sessionId: string, contractId?: string) {
    const session = this.need(sessionId);
    return this.execute(
      contractId ?? this.current(session).contractId,
      session,
    );
  }
  processInteraction(
    sessionId: string,
    input: Omit<
      InteractionEvent,
      | "id"
      | "sessionId"
      | "sequenceNumber"
      | "timestamp"
      | "contractId"
      | "executionId"
    >,
  ) {
    const session = this.need(sessionId);
    if (session.status !== "active")
      throw new Error(`Session is ${session.status}.`);
    const previous = this.current(session);
    const event = appendInteractionEvent(session, input, previous);
    const observation = updateSemanticScratchpad(session, event);
    session.liveContext = {
      dominantTopics: session.semanticScratchpad
        .slice(-4)
        .flatMap((item) => item.topics),
      inferredIntent: observation.inferredIntent,
      engagementScore: Number(
        Math.min(
          1,
          session.semanticScratchpad.reduce(
            (sum, item) => sum + item.strength,
            0,
          ) / 4,
        ).toFixed(2),
      ),
      lastMeaningfulAction: event.actionType,
    };
    const selected = previous.resolvedNextbounds.find(
      (nextbound) =>
        nextbound.id === input.nextboundId ||
        nextbound.destination.targetId === input.targetId,
    );
    if (input.actionType === "opportunity_claimed") {
      if (
        this.opportunity.status !== "available" &&
        this.opportunity.claimedBy !== session.id
      )
        throw new Error("Opportunity is no longer available.");
      this.opportunity = {
        ...this.opportunity,
        availableSlots: 0,
        status: "claimed",
        claimedBy: session.id,
      };
    }
    const targetContractId =
      selected?.destination.targetId ?? previous.contractId;
    const navigates = targetContractId !== previous.contractId;
    const execution = this.execute(targetContractId, session);
    const mutations = this.diff(previous, execution, navigates);
    return {
      event: structuredClone(event),
      observation: structuredClone(observation),
      previousExecution: structuredClone(previous),
      execution,
      mutations,
      session: structuredClone(session),
    };
  }
  resolveNextbounds(sessionId: string) {
    return structuredClone(
      this.current(this.need(sessionId)).resolvedNextbounds,
    );
  }
  getArtifactExecution(executionId: string) {
    const execution = this.executions.get(executionId);
    if (!execution) throw new Error("ArtifactExecution not found.");
    return structuredClone(execution);
  }
  getSessionTrace(sessionId: string) {
    const session = this.need(sessionId);
    return {
      session: structuredClone(session),
      currentExecution: structuredClone(this.current(session)),
      contract: structuredClone(
        continuousContracts[this.current(session).contractId],
      ),
      opportunity: structuredClone(this.opportunity),
    };
  }
  replaySession(
    seedId: string,
    recipientId: string,
    events: InteractionEvent[],
  ) {
    const replay = new ContinuousProceduralRuntime();
    const opened = replay.openSeed(seedId, recipientId);
    for (const event of events.filter(
      (item) => item.actionType !== "artifact_viewed",
    ))
      replay.processInteraction(opened.session.id, {
        actionType: event.actionType,
        targetId: event.targetId,
        nextboundId: event.nextboundId,
        frameId: event.frameId,
        dwellTimeMs: event.dwellTimeMs,
        metadata: structuredClone(event.metadata),
      });
    return replay.getSessionTrace(opened.session.id);
  }
  pause(sessionId: string) {
    const session = this.need(sessionId);
    session.status = "paused";
    return structuredClone(session);
  }
  resume(sessionId: string) {
    const session = this.need(sessionId);
    if (session.status !== "paused")
      throw new Error("Only paused sessions can resume.");
    session.status = "active";
    return structuredClone(session);
  }
  stop(sessionId: string) {
    const session = this.need(sessionId);
    session.status = "stopped";
    return structuredClone(session);
  }
  restart(sessionId: string) {
    const previous = this.need(sessionId);
    this.sessions.delete(sessionId);
    return this.openSeed(previous.seedId, previous.recipientId);
  }
  private execute(contractId: string, session: ExperienceSession) {
    const contract = continuousContracts[contractId];
    if (!contract) throw new Error("ArtifactContract not found.");
    const fingerprint = pathFingerprint(
      session.interactionLog,
      session.executionHistory,
    );
    const execution = executeArtifactContract({
      contract,
      okfContext: runtimeOkf[session.recipientId],
      sessionState: session,
      pathFingerprint: fingerprint,
      opportunityState: this.opportunity,
    });
    session.currentExecutionId = execution.id;
    session.executionHistory.push({
      executionId: execution.id,
      contractId: execution.contractId,
      visitId: execution.visitId,
      visitNumber: execution.visitNumber,
      pathFingerprint: execution.pathFingerprint,
    });
    this.executions.set(execution.id, structuredClone(execution));
    return structuredClone(execution);
  }
  private current(session: ExperienceSession) {
    const execution = this.executions.get(session.currentExecutionId);
    if (!execution) throw new Error("Current execution not found.");
    return execution;
  }
  private need(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Runtime session not found.");
    return session;
  }
  private diff(
    previous: ArtifactExecution,
    current: ArtifactExecution,
    navigates: boolean,
  ) {
    const mutations: ArtifactMutation[] = [];
    if (navigates)
      mutations.push({
        type: "navigate_to_contract",
        targetId: current.contractId,
        reason:
          "A resolved semantic Nextbound selected another ArtifactContract.",
      });
    if (
      JSON.stringify(previous.generatedContent) !==
      JSON.stringify(current.generatedContent)
    )
      mutations.push({
        type: "update_content",
        targetId: current.id,
        reason: "Composed context changed.",
      });
    if (
      JSON.stringify(previous.resolvedPresentation) !==
      JSON.stringify(current.resolvedPresentation)
    )
      mutations.push({
        type: "update_presentation",
        targetId: current.id,
        reason: "Live session context changed presentation resolution.",
      });
    for (const anchor of previous.activatedAnchors.filter(
      (old) =>
        !current.activatedAnchors.some((next) => next.phrase === old.phrase),
    ))
      mutations.push({
        type: "deactivate_anchor",
        targetId: anchor.id,
        reason: "Anchor lost relevance.",
      });
    for (const anchor of current.activatedAnchors.filter(
      (next) =>
        !previous.activatedAnchors.some((old) => old.phrase === next.phrase),
    ))
      mutations.push({
        type: "activate_anchor",
        targetId: anchor.id,
        reason: "Anchor gained relevance.",
      });
    for (const nextbound of previous.resolvedNextbounds.filter(
      (old) => !current.resolvedNextbounds.some((next) => next.id === old.id),
    ))
      mutations.push({
        type: "remove_nextbound",
        targetId: nextbound.id,
        reason: "Nextbound was recalculated.",
      });
    for (const nextbound of current.resolvedNextbounds.filter(
      (next) => !previous.resolvedNextbounds.some((old) => old.id === next.id),
    ))
      mutations.push({
        type: "add_nextbound",
        targetId: nextbound.id,
        reason: nextbound.semanticReason,
      });
    if (current.frames.some((frame) => frame.highlighted))
      mutations.push({
        type: "insert_frame",
        targetId: current.frames.at(-1)!.id,
        reason: "Relevant frame inserted near focus.",
      });
    return mutations;
  }
}
