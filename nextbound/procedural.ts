import type {
  ArtifactContract,
  ArtifactExecution,
  ContentModule,
  ExperienceSession,
  NextAction,
  NormalizedContext,
  SemanticObservation,
  SessionEvent,
  VisualTheme,
} from "./types.js";

export const visualLabContract: ArtifactContract = Object.freeze({
  contractId: "visual-lab",
  contractVersion: "1.0.0",
  title: "Visual Lab",
  invariantMessage:
    "Transform one memory into a visual world without altering Luna Vale’s original message or attribution.",
  allowedModuleTypes: ["message", "visual", "path"] as ContentModule["type"][],
  capabilities: ["visual_creation", "soundtrack", "short_film", "loop"],
});

export const soundscapeContract: ArtifactContract = Object.freeze({
  contractId: "memory-soundscape",
  contractVersion: "1.0.0",
  title: "Memory Soundscape",
  invariantMessage: "Extend the visual memory through attributed sound.",
  allowedModuleTypes: ["soundtrack", "path"] as ContentModule["type"][],
  capabilities: ["soundtrack", "short_film"],
});

export const cinematicContract: ArtifactContract = Object.freeze({
  contractId: "cinematic-composer",
  contractVersion: "1.0.0",
  title: "Cinematic Artifact Composer",
  invariantMessage:
    "Compose the attributed artifact path without rendering media.",
  allowedModuleTypes: ["film", "path"] as ContentModule["type"][],
  capabilities: ["short_film", "loop", "share"],
});

const fingerprint = (value: string) => {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `path-${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const action = (
  id: string,
  label: string,
  capability: string,
  source: string,
): NextAction => ({
  id,
  label,
  description: `Continue through ${capability.replaceAll("_", " ")}.`,
  requiredCapability: capability,
  destinationType: capability === "soundtrack" ? "creator_intent" : "artifact",
  sourceArtifactId: source,
});

const observations = (
  session: ExperienceSession,
  visitNumber: number,
): SemanticObservation[] => {
  if (visitNumber === 1)
    return [
      {
        id: "obs-initial-visual-language",
        eventIndex: session.eventLog.length,
        observation:
          "Maya selected visual creation as the first transformation.",
        influence: "Start with violet grain, red light and an open sound path.",
      },
    ];
  return [
    ...(session.actionHistory.includes("add-soundtrack")
      ? [
          {
            id: "obs-sound-attached",
            eventIndex: session.eventLog.length - 2,
            observation:
              "Elias North’s soundscape was connected after Visual Lab.",
            influence:
              "Replace suspended silence with pulse-led visual rhythm.",
          },
        ]
      : []),
    {
      id: "obs-cinematic-intent",
      eventIndex: session.eventLog.length - 1,
      observation: "The path was composed into a short cinematic artifact.",
      influence:
        "Use cinematic typography and propose iterative editing paths.",
    },
  ];
};

export function executeArtifactContract(
  contract: ArtifactContract,
  session: ExperienceSession,
  context: NormalizedContext,
): ArtifactExecution {
  const visitNumber =
    session.executions.filter((x) => x.contractId === contract.contractId)
      .length + 1;
  const path = session.eventLog
    .filter((event) => event.type !== "session_started")
    .map((event) => event.actionId ?? event.contractId ?? event.executionId)
    .join(">");
  const pathFingerprint = fingerprint(
    `${session.rootIntentId}|${session.profileId}|${path}|${contract.contractId}|${visitNumber}`,
  );
  const scratchpadObservations = observations(session, visitNumber);
  const evolved = contract.contractId === "visual-lab" && visitNumber > 1;
  const includesSound = session.actionHistory.includes("add-soundtrack");
  const presentation: VisualTheme = evolved
    ? {
        key: "maya-return",
        accent: "#8f7cff",
        surface: "#100c28",
        mood: "cinematic · pulse-led · recursively visual",
      }
    : {
        key: "maya",
        accent: "#e54472",
        surface: "#190716",
        mood: "expressive · cinematic · shareable",
      };
  let content: ContentModule[];
  let nextbounds: NextAction[];
  let nextboundExplanation: string[];
  if (contract.contractId === "visual-lab") {
    content = evolved
      ? [
          {
            id: "visual-return",
            type: "visual",
            title: "Maya’s Visual Memory / Resonant Cut",
            body: includesSound
              ? "Violet frames now pulse with Elias’s glass harmonics; cinematic cuts reveal words that were previously latent."
              : "Violet frames return as silent cinematic cuts; latent words surface through motion and contrast.",
          },
          {
            id: "semantic-anchors",
            type: "path",
            title: "New semantic anchors",
            body: "pulse · afterimage · resonant cut · returning light",
          },
        ]
      : [
          {
            id: "visual-result",
            type: "visual",
            title: "Maya’s Visual Memory",
            body: "A red-violet memory field assembling into a moving world.",
          },
        ];
    nextbounds = evolved
      ? [
          action(
            includesSound ? "edit-resonance" : "deepen-visual-cut",
            includesSound ? "Edit the resonant cut" : "Deepen the visual cut",
            "visual_creation",
            "visual-lab",
          ),
          action(
            includesSound ? "remix-sound" : "add-return-sound",
            includesSound ? "Remix image and sound" : "Add sound to the return",
            "soundtrack",
            "visual-lab",
          ),
          action(
            "share-return",
            "Share the transformed loop",
            "share",
            "visual-lab",
          ),
        ]
      : [
          action(
            "add-soundtrack",
            "Add a soundtrack",
            "soundtrack",
            "maya-visual-memory",
          ),
          action(
            "short-film",
            "Turn it into a short film",
            "short_film",
            "maya-visual-memory",
          ),
          action(
            "share-world",
            "Share my world",
            "share",
            "maya-visual-memory",
          ),
          action("stop", "Stop here", "stop", "maya-visual-memory"),
        ];
    nextboundExplanation = evolved
      ? [
          includesSound
            ? "Session path contributes 60%: sound and cinema make resonance and remix the strongest continuations."
            : "Session path contributes 60%: the silent cinematic route prioritizes visual editing and a newly available sound layer.",
          `OKF contributes 40%: ${context.preferences.slice(0, 2).join(" and ")} keep the return visual and expressive.`,
        ]
      : [
          "OKF visual and expressive preferences open the initial creation path.",
          "The empty session path keeps soundtrack, film and sharing equally available.",
        ];
  } else if (contract.contractId === "memory-soundscape") {
    content = [
      {
        id: "soundtrack",
        type: "soundtrack",
        title: "Memory Soundscape",
        body: "A low pulse, glass harmonics, and a voice dissolving into distance.",
      },
    ];
    nextbounds = [
      action(
        "short-film",
        "Turn it into a short film",
        "short_film",
        contract.contractId,
      ),
    ];
    nextboundExplanation = [
      "The visual artifact makes cinematic composition the ordered next contract.",
    ];
  } else {
    content = [
      {
        id: "film",
        type: "film",
        title: "AFTERLIGHT / Memory Film",
        body: "00:24 demo preview · Luna’s message, Maya’s world, Elias’s sound.",
      },
      {
        id: "path",
        type: "path",
        title: "Artifact path",
        body: "Luna’s Intent → Maya in Visual Lab → Elias North’s Memory Soundscape → Cinematic Artifact Composer",
      },
    ];
    nextbounds = [
      action(
        "return-visual-lab",
        "Return to Visual Lab",
        "loop",
        contract.contractId,
      ),
      action(
        "share-final",
        "Share the final artifact",
        "share",
        contract.contractId,
      ),
      action("stop", "Stop here", "stop", contract.contractId),
    ];
    nextboundExplanation = [
      "The completed film exposes a loop back to the stable Visual Lab contract.",
    ];
  }
  if (
    content.some((module) => !contract.allowedModuleTypes.includes(module.type))
  )
    throw new Error(
      `Contract ${contract.contractId} emitted a disallowed module.`,
    );
  return {
    contractId: contract.contractId,
    contractVersion: contract.contractVersion,
    executionId: `${contract.contractId}-execution-${visitNumber}-${pathFingerprint.slice(-4)}`,
    visitNumber,
    pathFingerprint,
    okfContribution: 0.4,
    sessionContribution: 0.6,
    content,
    presentation,
    anchors:
      contract.contractId !== "visual-lab"
        ? []
        : evolved
          ? [
              {
                id: "violet-grain",
                label: "violet grain",
                active: false,
                state: "fading",
              },
              {
                id: "red-light",
                label: "red light",
                active: false,
                state: "fading",
              },
              { id: "pulse", label: "pulse", active: true, state: "emerging" },
              {
                id: "resonant-cut",
                label: "resonant cut",
                active: true,
                state: "emerging",
              },
            ]
          : [
              {
                id: "violet-grain",
                label: "violet grain",
                active: true,
                state: "retained",
              },
              {
                id: "red-light",
                label: "red light",
                active: true,
                state: "retained",
              },
            ],
    nextbounds,
    scratchpadObservations,
    nextboundExplanation,
  };
}

export function executionEvent(
  session: ExperienceSession,
  execution: ArtifactExecution,
): SessionEvent {
  return {
    index: session.eventLog.length,
    type: "contract_executed",
    contractId: execution.contractId,
    executionId: execution.executionId,
    pathFingerprint: execution.pathFingerprint,
  };
}

export function replayArtifactEvents(events: SessionEvent[]) {
  const ordered = [...events].sort((a, b) => a.index - b.index);
  return ordered.reduce(
    (state, event) => {
      if (event.type === "action_selected" && event.actionId)
        state.actions.push(event.actionId);
      if (event.type === "contract_executed" && event.executionId)
        state.executions.push(event.executionId);
      return state;
    },
    { actions: [] as string[], executions: [] as string[] },
  );
}
