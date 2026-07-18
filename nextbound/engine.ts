import { eliasSoundscape, profiles, tools } from "./fixtures.js";
import {
  cinematicContract,
  executeArtifactContract,
  executionEvent,
  soundscapeContract,
  visualLabContract,
} from "./procedural.js";
import type {
  Artifact,
  CompiledExperience,
  Contribution,
  ExperienceNode,
  ExperienceSession,
  NextAction,
  NextboundIntent,
  NormalizedContext,
  OKFProfile,
  ToolMatch,
} from "./types.js";

const configs = {
  alex: {
    title: "AFTERLIGHT: Build the Memory Machine",
    theme: {
      key: "alex",
      accent: "#38a8ff",
      surface: "#061323",
      mood: "technical · generative · exploratory",
    },
    modules: [
      {
        id: "alex-code",
        type: "code" as const,
        title: "Memory map / system seed",
        body: "memory.attach(moment) → transform(signal) → artifact",
      },
    ],
    actions: [
      ["open-system", "Open the system", "explore"],
      ["build-version", "Build your version", "visual_creation"],
    ],
  },
  camille: {
    title: "AFTERLIGHT: A Private Memory Salon in Paris",
    theme: {
      key: "camille",
      accent: "#d8c6a3",
      surface: "#eee8dc",
      mood: "editorial · architectural · private",
    },
    modules: [
      {
        id: "salon",
        type: "invitation" as const,
        title: "A private invitation",
        body: "Paris · an intimate architectural encounter · reservation is a demo only",
      },
    ],
    actions: [
      ["enter-salon", "Enter the salon", "explore"],
      ["locations", "Explore the locations", "explore"],
      ["reserve", "Reserve the experience", "demo_reservation"],
    ],
  },
  maya: {
    title: "AFTERLIGHT: Turn One Memory Into a Visual World",
    theme: {
      key: "maya",
      accent: "#e54472",
      surface: "#190716",
      mood: "expressive · cinematic · shareable",
    },
    modules: [
      {
        id: "moodboard",
        type: "visual" as const,
        title: "A memory, becoming visual",
        body: "Violet grain · red light · fashion fragments · a suspended soundtrack",
      },
    ],
    actions: [
      ["create-visual", "Create my visual memory", "visual_creation"],
      ["explore-soundtrack", "Explore a soundtrack", "soundtrack"],
      ["share-world-initial", "Share my world", "share"],
    ],
  },
} as const;
const action = (
  tuple: readonly [string, string, string],
  source = "afterlight",
): NextAction => ({
  id: tuple[0],
  label: tuple[1],
  description: `Continue through ${tuple[2].replaceAll("_", " ")}.`,
  requiredCapability: tuple[2],
  destinationType:
    tuple[2] === "soundtrack"
      ? "creator_intent"
      : tuple[2] === "share"
        ? "partner_experience"
        : "artifact",
  sourceArtifactId: source,
});
const lunaContribution: Contribution = {
  contributorId: "luna-vale",
  contributorName: "Luna Vale",
  artifactId: "afterlight",
  role: "original_creator",
  attributionWeight: 1,
};
export function resolveOkfContext(profile: OKFProfile): NormalizedContext {
  const copy = structuredClone(profile);
  return {
    profileId: copy.id,
    role: copy.role,
    signals: copy.knowledge.slice(0, 4),
    preferences: copy.preferences,
    explanation: [
      `${copy.knowledge.slice(0, 2).join(" and ")} shaped the subject matter.`,
      `${copy.preferences.slice(0, 2).join(" and ")} shaped the presentation.`,
    ],
  };
}
export function compileExperience(
  intent: NextboundIntent,
  profile: OKFProfile,
): CompiledExperience {
  const c = configs[profile.id],
    ctx = resolveOkfContext(profile);
  const actions = c.actions.map((x) => action(x));
  const modules = [
    {
      id: "immutable-message",
      type: "message" as const,
      title: intent.campaign,
      body: intent.immutableMessage.text,
    },
    ...c.modules,
  ];
  const firstNode: ExperienceNode = {
    id: `${profile.id}-node-1`,
    title: c.title,
    kind: "personalized_intent",
    summary: c.theme.mood,
    modules,
    actions,
  };
  const session: ExperienceSession = {
    id: `session-${profile.id}`,
    rootIntentId: intent.id,
    profileId: profile.id,
    currentNodeId: firstNode.id,
    nodeHistory: [firstNode.id],
    actionHistory: [],
    contributors: [lunaContribution],
    status: "active",
    nodes: [firstNode],
    connections: [],
    eventLog: [{ index: 0, type: "session_started" }],
    semanticScratchpad: [],
    executions: [],
  };
  return {
    originalIntent: structuredClone(intent),
    immutableMessage: structuredClone(intent.immutableMessage),
    creatorAttribution: lunaContribution,
    personalizedTitle: c.title,
    visualTheme: c.theme,
    contentModules: modules,
    initialActions: actions,
    matchedCapabilities: actions.map((a) => a.requiredCapability),
    selectedTools: profile.id === "maya" ? [tools[0]] : [],
    personalizationExplanation: ctx.explanation,
    firstNode,
    contributors: [lunaContribution],
    session,
  };
}
export function matchTool(capability: string): ToolMatch {
  if (capability === "soundtrack")
    return {
      capability,
      artifact: eliasSoundscape,
      score: 0.96,
      reason:
        "Music and visual-storytelling signals match an adaptive soundtrack.",
    };
  const tool = tools.find((t) => t.capabilities.includes(capability));
  return {
    capability,
    tool,
    score: tool?.id === "cinematic-composer" ? 0.99 : 0.94,
    reason: tool
      ? `${tool.name} provides ${capability}.`
      : "No specialized local tool required.",
  };
}
const nextActions = (node: number): NextAction[] =>
  (node === 2
    ? [
        ["add-soundtrack", "Add a soundtrack", "soundtrack"],
        ["short-film", "Turn it into a short film", "short_film"],
        ["share-world", "Share my world", "share"],
        ["stop", "Stop here", "stop"],
      ]
    : node === 3
      ? [
          ["variation", "Generate my variation", "visual_creation"],
          ["short-film", "Turn it into a short film", "short_film"],
          ["share-experience", "Share this experience", "share"],
          ["stop", "Stop here", "stop"],
        ]
      : [
          ["share-final", "Share the final artifact", "share"],
          ["stop", "Stop here", "stop"],
        ]
  ).map((x) =>
    action(
      x as [string, string, string],
      node === 2
        ? "maya-visual-memory"
        : node === 3
          ? eliasSoundscape.id
          : "afterlight-short-film",
    ),
  );
export function resolveNextAction(
  input: ExperienceSession,
  selected: NextAction,
): ExperienceSession {
  const s = structuredClone(input);
  if (s.status !== "active") throw new Error(`Session is ${s.status}`);
  s.actionHistory.push(selected.id);
  s.eventLog.push({
    index: s.eventLog.length,
    type: "action_selected",
    actionId: selected.id,
  });
  if (selected.id === "stop") {
    s.status = "completed";
    return s;
  }
  const match = matchTool(selected.requiredCapability);
  let node: ExperienceNode;
  if (
    selected.id === "create-visual" ||
    selected.id === "variation" ||
    selected.id === "return-visual-lab"
  ) {
    const execution = executeArtifactContract(
      visualLabContract,
      s,
      resolveOkfContext(
        profiles.find((profile) => profile.id === s.profileId)!,
      ),
    );
    const artifact: Artifact = {
      id: "maya-visual-memory",
      title: "Maya’s Visual Memory",
      type: "visual_artifact",
      creatorId: "maya",
      creatorName: "Maya",
      preview: execution.content[0].body,
    };
    node = {
      id: `maya-visual-${execution.executionId}`,
      title:
        execution.visitNumber === 1
          ? "Your visual memory is taking form"
          : "Visual Lab returns transformed",
      kind: "visual_artifact",
      summary:
        execution.visitNumber === 1
          ? `Created with ${match.tool?.name}`
          : "Same contract · New execution",
      modules: execution.content,
      actions: execution.nextbounds,
      artifact,
      execution,
    };
    s.executions.push(execution);
    s.semanticScratchpad.push(...execution.scratchpadObservations);
    s.eventLog.push(executionEvent(s, execution));
    add(s, {
      contributorId: "maya",
      contributorName: "Maya",
      artifactId: artifact.id,
      role: "next_action_creator",
      attributionWeight: 0.8,
    });
  } else if (
    selected.id === "add-soundtrack" ||
    selected.id === "explore-soundtrack"
  ) {
    const execution = executeArtifactContract(
      soundscapeContract,
      s,
      resolveOkfContext(
        profiles.find((profile) => profile.id === s.profileId)!,
      ),
    );
    node = {
      id: `maya-sound-${execution.executionId}`,
      title: "Memory Soundscape connected",
      kind: "connected_artifact",
      summary:
        "Elias North’s adaptive soundtrack now inhabits the visual world.",
      modules: execution.content,
      actions: execution.nextbounds,
      artifact: eliasSoundscape,
      execution,
    };
    s.executions.push(execution);
    s.semanticScratchpad.push(...execution.scratchpadObservations);
    s.eventLog.push(executionEvent(s, execution));
    add(s, {
      contributorId: "elias-north",
      contributorName: "Elias North",
      artifactId: eliasSoundscape.id,
      role: "next_action_creator",
      attributionWeight: 0.7,
    });
    s.connections.push({
      id: "connection-sound",
      sourceArtifactId: selected.sourceArtifactId,
      targetArtifactId: eliasSoundscape.id,
      triggerActionId: selected.id,
      compatibilityScore: match.score,
      attributionRules: [
        {
          contributorId: "elias-north",
          display: "always",
          label: "Adaptive soundtrack by Elias North",
        },
      ],
    });
  } else if (selected.id === "short-film") {
    const execution = executeArtifactContract(
      cinematicContract,
      s,
      resolveOkfContext(
        profiles.find((profile) => profile.id === s.profileId)!,
      ),
    );
    const artifact = {
      id: "afterlight-short-film",
      title: "AFTERLIGHT / Memory Film",
      type: "short_film",
      creatorId: "cinematic-composer",
      creatorName: "Cinematic Artifact Composer",
      preview:
        "00:24 demo preview · Luna’s message, Maya’s world, Elias’s sound.",
    };
    node = {
      id: `maya-film-${execution.executionId}`,
      title: "The memory becomes cinema",
      kind: "final_artifact",
      summary: "A deterministic local composition — no media was rendered.",
      modules: execution.content,
      actions: execution.nextbounds,
      artifact,
      execution,
    };
    s.executions.push(execution);
    s.semanticScratchpad.push(...execution.scratchpadObservations);
    s.eventLog.push(executionEvent(s, execution));
    add(s, {
      contributorId: "cinematic-composer",
      contributorName: "Cinematic Artifact Composer",
      artifactId: artifact.id,
      role: "tool_provider",
      attributionWeight: 0.5,
    });
  } else {
    node = {
      id: `${s.profileId}-node-${s.nodes.length + 1}`,
      title: selected.label,
      kind: "capability",
      summary: "A deterministic demo continuation.",
      modules: [
        {
          id: `module-${selected.id}`,
          type: "path",
          title: "Nextbound path",
          body: `Capability resolved: ${selected.requiredCapability.replaceAll("_", " ")}.`,
        },
      ],
      actions: [action(["stop", "Stop here", "stop"])],
    };
  }
  node.createdByActionId = selected.id;
  s.nodes.push(node);
  s.currentNodeId = node.id;
  s.nodeHistory.push(node.id);
  return s;
}
function add(s: ExperienceSession, c: Contribution) {
  if (!s.contributors.some((x) => x.contributorId === c.contributorId))
    s.contributors.push(c);
}
export const pauseExperience = (s: ExperienceSession): ExperienceSession => ({
  ...structuredClone(s),
  status: "paused",
});
