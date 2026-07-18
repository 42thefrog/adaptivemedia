export type DestinationType =
  "artifact" | "tool" | "creator_intent" | "partner_experience";
export type ImmutableMessage = { text: string; locked: true };
export type AdaptationRule = {
  field:
    | "format"
    | "narrative"
    | "visual_language"
    | "tools"
    | "next_actions"
    | "interactive_components";
  allowed: true;
};
export type Sender = { id: string; name: string; role: string };
export type NextboundIntent = {
  id: string;
  sender: Sender;
  campaign: string;
  immutableMessage: ImmutableMessage;
  adaptationRules: AdaptationRule[];
  locked: string[];
  capabilities: string[];
};
export type OKFProfile = {
  id: "alex" | "camille" | "maya";
  name: string;
  role: string;
  knowledge: string[];
  preferences: string[];
};
export type InboxMessage = {
  id: string;
  intentId: string;
  profileId: OKFProfile["id"];
  deliveredAt: string;
  unread: boolean;
};
export type Capability = { id: string; label: string };
export type ToolDefinition = {
  id: string;
  name: string;
  capabilities: string[];
  role: "tool_provider";
};
export type ToolMatch = {
  capability: string;
  tool?: ToolDefinition;
  artifact?: Artifact;
  score: number;
  reason: string;
};
export type Artifact = {
  id: string;
  title: string;
  type: string;
  creatorId: string;
  creatorName: string;
  preview: string;
};
export type AttributionRule = {
  contributorId: string;
  display: "always";
  label: string;
};
export type ArtifactConnection = {
  id: string;
  sourceArtifactId: string;
  targetArtifactId: string;
  triggerActionId: string;
  compatibilityScore: number;
  attributionRules: AttributionRule[];
};
export type NextAction = {
  id: string;
  label: string;
  description: string;
  requiredCapability: string;
  destinationType: DestinationType;
  sourceArtifactId: string;
};
export type Contribution = {
  contributorId: string;
  contributorName: string;
  artifactId: string;
  role:
    | "original_creator"
    | "next_action_creator"
    | "tool_provider"
    | "commercial_partner";
  attributionWeight: number;
};
export type ExperienceNode = {
  id: string;
  title: string;
  kind: string;
  summary: string;
  modules: ContentModule[];
  actions: NextAction[];
  artifact?: Artifact;
  execution?: ArtifactExecution;
  createdByActionId?: string;
};
export type ContentModule = {
  id: string;
  type:
    | "message"
    | "visual"
    | "code"
    | "invitation"
    | "soundtrack"
    | "film"
    | "path";
  title: string;
  body: string;
};
export type ExperienceSession = {
  id: string;
  rootIntentId: string;
  profileId: string;
  currentNodeId: string;
  nodeHistory: string[];
  actionHistory: string[];
  contributors: Contribution[];
  status: "active" | "paused" | "completed";
  nodes: ExperienceNode[];
  connections: ArtifactConnection[];
  eventLog: SessionEvent[];
  semanticScratchpad: SemanticObservation[];
  executions: ArtifactExecution[];
};

export type ArtifactContract = {
  contractId: string;
  contractVersion: string;
  title: string;
  invariantMessage: string;
  allowedModuleTypes: ContentModule["type"][];
  capabilities: string[];
};

export type ExecutionAnchor = {
  id: string;
  label: string;
  active: boolean;
  state: "retained" | "fading" | "emerging";
};

export type SemanticObservation = {
  id: string;
  eventIndex: number;
  observation: string;
  influence: string;
};

export type ArtifactExecution = {
  contractId: string;
  contractVersion: string;
  executionId: string;
  visitNumber: number;
  pathFingerprint: string;
  okfContribution: 0.4;
  sessionContribution: 0.6;
  content: ContentModule[];
  presentation: VisualTheme;
  anchors: ExecutionAnchor[];
  nextbounds: NextAction[];
  scratchpadObservations: SemanticObservation[];
  nextboundExplanation: string[];
};

export type SessionEvent = {
  index: number;
  type: "session_started" | "action_selected" | "contract_executed";
  actionId?: string;
  contractId?: string;
  executionId?: string;
  pathFingerprint?: string;
};
export type CompiledExperience = {
  originalIntent: NextboundIntent;
  immutableMessage: ImmutableMessage;
  creatorAttribution: Contribution;
  personalizedTitle: string;
  visualTheme: VisualTheme;
  contentModules: ContentModule[];
  initialActions: NextAction[];
  matchedCapabilities: string[];
  selectedTools: ToolDefinition[];
  personalizationExplanation: string[];
  firstNode: ExperienceNode;
  contributors: Contribution[];
  session: ExperienceSession;
};
export type VisualTheme = {
  key: string;
  accent: string;
  surface: string;
  mood: string;
};
export type ShareableArtifact = {
  id: string;
  sessionId: string;
  title: string;
  contributorIds: string[];
  demoUrl: string;
};
export type DemoTimelineScene = {
  id: string;
  duration: number;
  title: string;
  narration: string;
  expectedState: string;
  transitionType: "cut" | "fade" | "expand" | "morph";
};
export type NormalizedContext = {
  profileId: string;
  role: string;
  signals: string[];
  preferences: string[];
  explanation: string[];
};
