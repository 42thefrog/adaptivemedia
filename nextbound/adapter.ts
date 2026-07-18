import { NextboundService } from "./service.js";

export const nextboundToolNames = [
  "publish_intent",
  "deliver_to_inbox",
  "resolve_okf_context",
  "compile_experience",
  "resolve_next_action",
  "match_tool",
  "connect_artifact",
  "get_experience_session",
  "pause_experience",
  "resume_experience",
  "stop_experience",
  "restart_experience",
  "share_experience",
] as const;
export type NextboundToolName = (typeof nextboundToolNames)[number];
export const proceduralToolNames = [
  "open_seed",
  "execute_artifact_contract",
  "process_interaction",
  "resolve_nextbounds",
  "get_artifact_execution",
  "get_session_trace",
  "replay_session",
] as const;
export type ProceduralToolName = (typeof proceduralToolNames)[number];
export type NextboundRuntimeToolName = NextboundToolName | ProceduralToolName;

export class LocalToolAdapter {
  constructor(private service = new NextboundService()) {}
  async call(
    name: NextboundRuntimeToolName,
    args: Record<string, any> = {},
  ): Promise<any> {
    switch (name) {
      case "open_seed":
        return this.service.openSeed(args.seedId, args.recipientId);
      case "execute_artifact_contract":
        return this.service.executeArtifactContract(
          args.sessionId,
          args.contractId,
        );
      case "process_interaction":
        return this.service.processInteraction(args as any);
      case "resolve_nextbounds":
        return this.service.resolveProceduralNextbounds(args.sessionId);
      case "get_artifact_execution":
        return this.service.getArtifactExecution(args.executionId);
      case "get_session_trace":
        return this.service.getSessionTrace(args.sessionId);
      case "replay_session":
        return this.service.replayProceduralSession(
          args.seedId,
          args.recipientId,
          args.sessionId,
        );
      case "publish_intent":
        return this.service.publishIntent(args.intentId ?? "afterlight");
      case "deliver_to_inbox":
        return this.service.deliverToInbox(
          args.intentId ?? "afterlight",
          args.profileIds ?? ["alex", "camille", "maya"],
        );
      case "resolve_okf_context":
        return this.service.resolveOkfContext(
          args.intentId ?? "afterlight",
          args.profileId,
        );
      case "compile_experience":
        return this.service.compileExperience(
          args.intentId ?? "afterlight",
          args.profileId,
        );
      case "resolve_next_action":
        return this.service.resolveNextAction(args.sessionId, args.actionId);
      case "match_tool":
        return this.service.matchTool(args.requiredCapability);
      case "connect_artifact":
        return this.service.connectArtifact(
          args.sessionId,
          args.sourceArtifactId,
          args.targetArtifactId,
          args.triggerActionId,
        );
      case "get_experience_session":
        return this.service.getExperienceSession(args.sessionId);
      case "pause_experience":
        return this.service.pause(args.sessionId);
      case "resume_experience":
        return this.service.resume(args.sessionId);
      case "stop_experience":
        return this.service.stop(args.sessionId);
      case "restart_experience":
        return this.service.restart(args.sessionId);
      case "share_experience":
        return this.service.share(args.sessionId);
    }
  }
}
export const localToolAdapter = new LocalToolAdapter();
