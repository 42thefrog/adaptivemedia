import {
  compileExperience,
  matchTool,
  pauseExperience,
  resolveNextAction,
  resolveOkfContext,
} from "./engine.js";
import { parseIntentDsl } from "./dsl.js";
import {
  eliasSoundscape,
  intentDsl,
  luna,
  profiles,
  tools,
} from "./fixtures.js";
import type {
  ExperienceSession,
  InboxMessage,
  ShareableArtifact,
} from "./types.js";
import {
  ContinuousProceduralRuntime,
  type InteractionActionType,
} from "./runtime.js";

export class NextboundError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const actionAliases: Record<string, string> = {
  create_visual_memory: "create-visual",
  add_soundtrack: "add-soundtrack",
  turn_into_short_film: "short-film",
};

export class NextboundService {
  private sessions = new Map<string, ExperienceSession>();
  private published = new Set<string>();
  private procedural = new ContinuousProceduralRuntime();

  openSeed(seedId: string, recipientId: string) {
    return {
      view: "procedural_runtime" as const,
      ...this.procedural.openSeed(seedId, recipientId),
    };
  }

  executeArtifactContract(sessionId: string, contractId?: string) {
    return {
      view: "procedural_runtime" as const,
      execution: this.procedural.executeArtifactContract(sessionId, contractId),
    };
  }

  processInteraction(input: {
    sessionId: string;
    actionType: InteractionActionType;
    targetId?: string;
    nextboundId?: string;
    frameId?: string;
    dwellTimeMs?: number;
    metadata?: Record<string, unknown>;
  }) {
    const { sessionId, ...event } = input;
    return {
      view: "procedural_runtime" as const,
      ...this.procedural.processInteraction(sessionId, {
        ...event,
        metadata: event.metadata ?? {},
      }),
    };
  }

  resolveProceduralNextbounds(sessionId: string) {
    return {
      view: "procedural_runtime" as const,
      nextbounds: this.procedural.resolveNextbounds(sessionId),
    };
  }

  getArtifactExecution(executionId: string) {
    return {
      view: "procedural_runtime" as const,
      execution: this.procedural.getArtifactExecution(executionId),
    };
  }

  getSessionTrace(sessionId: string) {
    return {
      view: "procedural_runtime" as const,
      ...this.procedural.getSessionTrace(sessionId),
    };
  }

  replayProceduralSession(
    seedId: string,
    recipientId: string,
    sessionId: string,
  ) {
    const trace = this.procedural.getSessionTrace(sessionId);
    return {
      view: "procedural_runtime" as const,
      ...this.procedural.replaySession(
        seedId,
        recipientId,
        trace.session.interactionLog,
      ),
    };
  }

  publishIntent(intentId: string) {
    this.intent(intentId);
    this.published.add(intentId);
    return {
      view: "publisher" as const,
      intent: parseIntentDsl(intentDsl, luna),
      sender: structuredClone(luna.sender),
      publicationStatus: "published" as const,
      availableChannels: ["nextbound_inbox"],
    };
  }

  deliverToInbox(intentId: string, profileIds: string[]) {
    this.intent(intentId);
    const deliveries = profileIds.map((id, index): InboxMessage => {
      this.profile(id);
      return {
        id: `inbox-${intentId}-${id}`,
        intentId,
        profileId: id as "alex" | "camille" | "maya",
        deliveredAt: `2026-07-17T10:0${index}:00Z`,
        unread: true,
      };
    });
    return { view: "inbox" as const, deliveries };
  }

  resolveOkfContext(intentId: string, profileId: string) {
    this.intent(intentId);
    const context = resolveOkfContext(this.profile(profileId));
    return {
      view: "context_resolution" as const,
      profileId,
      normalizedContext: {
        role: context.role,
        signals: context.signals,
        preferences: context.preferences,
      },
      signalsUsed: [...context.signals],
      contextExplanation: context.explanation.join(" "),
    };
  }

  compileExperience(intentId: string, profileId: string) {
    this.intent(intentId);
    const experience = compileExperience(luna, this.profile(profileId));
    const existing = this.sessions.get(experience.session.id);
    const session = existing ?? experience.session;
    this.sessions.set(session.id, session);
    return this.experienceView(experience, session);
  }

  resolveNextAction(sessionId: string, actionId: string) {
    const session = this.need(sessionId);
    const previousNode = this.current(session);
    const normalized = actionAliases[actionId] ?? actionId;
    const selected = previousNode.actions.find((a) => a.id === normalized);
    if (!selected)
      throw new NextboundError(
        "unknown_action",
        "That action is not available in the current experience.",
      );
    const updated = resolveNextAction(session, selected);
    this.sessions.set(updated.id, updated);
    const currentNode = this.current(updated);
    const execution = currentNode.execution;
    const previousExecution = execution
      ? updated.executions
          .filter((item) => item.contractId === execution.contractId)
          .at(-2)
      : undefined;
    return {
      view: "experience" as const,
      session: structuredClone(updated),
      previousNode: structuredClone(previousNode),
      currentNode: structuredClone(currentNode),
      addedModules: structuredClone(currentNode.modules),
      nextActions: structuredClone(currentNode.actions),
      contributors: structuredClone(updated.contributors),
      artifactPath: this.artifactPath(updated),
      executionTransition:
        execution && previousExecution
          ? {
              from: structuredClone(previousExecution),
              to: structuredClone(execution),
              indicator: "Same contract · New execution",
              navigationRequired: false,
            }
          : null,
    };
  }

  matchTool(requiredCapability: string) {
    const match = matchTool(requiredCapability);
    if (!match.tool)
      throw new NextboundError(
        "no_compatible_tool",
        "No registered executable tool supports that capability.",
      );
    return {
      selectedTool: match.tool,
      compatibilityScore: match.score,
      matchReason: match.reason,
      alternativeTools: tools.filter(
        (t) =>
          t.id !== match.tool!.id &&
          t.capabilities.includes(requiredCapability),
      ),
    };
  }

  connectArtifact(
    sessionId: string,
    sourceArtifactId: string,
    targetArtifactId: string,
    triggerActionId: string,
  ) {
    const session = this.need(sessionId);
    if (targetArtifactId !== eliasSoundscape.id)
      throw new NextboundError(
        "unknown_artifact",
        "That artifact is not available.",
      );
    const connection = session.connections.find(
      (c) =>
        c.sourceArtifactId === sourceArtifactId &&
        c.targetArtifactId === targetArtifactId &&
        c.triggerActionId ===
          (actionAliases[triggerActionId] ?? triggerActionId),
    );
    if (!connection)
      throw new NextboundError(
        "incompatible_artifact",
        "The artifact has not been connected by the selected action.",
      );
    return {
      view: "experience" as const,
      connection: structuredClone(connection),
      session: structuredClone(session),
      contributors: structuredClone(session.contributors),
      currentNode: structuredClone(this.current(session)),
    };
  }

  getExperienceSession(sessionId: string) {
    const session = this.need(sessionId);
    return {
      view: "experience" as const,
      session: structuredClone(session),
      currentNode: structuredClone(this.current(session)),
      history: structuredClone(session.nodes),
      nextActions: structuredClone(this.current(session).actions),
      contributors: structuredClone(session.contributors),
      artifactPath: this.artifactPath(session),
    };
  }

  pause(sessionId: string): any {
    if (this.procedural.hasSession(sessionId))
      return {
        view: "procedural_runtime",
        session: this.procedural.pause(sessionId),
      };
    return this.control(pauseExperience(this.need(sessionId)));
  }
  resume(sessionId: string): any {
    if (this.procedural.hasSession(sessionId))
      return {
        view: "procedural_runtime",
        session: this.procedural.resume(sessionId),
      };
    const session = structuredClone(this.need(sessionId));
    if (session.status !== "paused")
      throw new NextboundError(
        "invalid_session_state",
        "Only a paused experience can be resumed.",
      );
    session.status = "active";
    return this.control(session);
  }
  stop(sessionId: string): any {
    if (this.procedural.hasSession(sessionId))
      return {
        view: "procedural_runtime",
        session: this.procedural.stop(sessionId),
      };
    const session = structuredClone(this.need(sessionId));
    session.status = "completed";
    return this.control(session);
  }
  restart(sessionId: string): any {
    if (this.procedural.hasSession(sessionId)) {
      const restarted = this.procedural.restart(sessionId);
      return { view: "procedural_runtime", ...restarted };
    }
    const old = this.need(sessionId),
      fresh = compileExperience(luna, this.profile(old.profileId)).session;
    this.sessions.set(fresh.id, fresh);
    return this.control(fresh);
  }

  share(sessionId: string) {
    const session = this.need(sessionId),
      current = this.current(session);
    const artifact: ShareableArtifact = {
      id: `share-${session.id}`,
      sessionId: session.id,
      title: current.artifact?.title ?? current.title,
      contributorIds: session.contributors.map((c) => c.contributorId),
      demoUrl: `nextbound://share/${session.id}`,
    };
    return {
      view: "share" as const,
      shareId: artifact.id,
      mode: "local_demo" as const,
      rootIntent: {
        id: luna.id,
        title: luna.campaign,
        creator: luna.sender.name,
      },
      artifact,
      contributors: structuredClone(session.contributors),
      invitationAction: {
        label: "Create what AFTERLIGHT becomes for you",
        intentId: luna.id,
      },
    };
  }

  private experienceView(
    experience: ReturnType<typeof compileExperience>,
    session: ExperienceSession,
  ) {
    return {
      view: "experience" as const,
      session: structuredClone(session),
      experience: { ...experience, session: structuredClone(session) },
      currentNode: structuredClone(this.current(session)),
      nextActions: structuredClone(this.current(session).actions),
      contributors: structuredClone(session.contributors),
    };
  }
  private control(session: ExperienceSession) {
    this.sessions.set(session.id, session);
    return {
      view: "experience" as const,
      session: structuredClone(session),
      currentNode: structuredClone(this.current(session)),
    };
  }
  private intent(id: string) {
    if (id !== luna.id)
      throw new NextboundError(
        "unknown_intent",
        "That Intent is not available in this demo.",
      );
    return luna;
  }
  private profile(id: string) {
    const profile = profiles.find((p) => p.id === id);
    if (!profile)
      throw new NextboundError(
        "unknown_profile",
        "That profile is not available in this demo.",
      );
    return profile;
  }
  private need(id: string) {
    const session = this.sessions.get(id);
    if (!session)
      throw new NextboundError(
        "unknown_session",
        "That experience session does not exist.",
      );
    return session;
  }
  private current(session: ExperienceSession) {
    return session.nodes.find((n) => n.id === session.currentNodeId)!;
  }
  private artifactPath(session: ExperienceSession) {
    return session.nodes
      .flatMap((n) => (n.artifact ? [n.artifact.id] : []))
      .concat(session.rootIntentId);
  }
}
