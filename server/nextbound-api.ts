import { z } from "zod";
const id = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_-]+$/i);
const strict = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();
export const schemas = {
  publish_intent: strict({ intentId: id }),
  deliver_to_inbox: strict({
    intentId: id,
    profileIds: z.array(id).min(1).max(3),
  }),
  resolve_okf_context: strict({
    intentId: id,
    profileId: z.enum(["alex", "camille", "maya"]),
  }),
  compile_experience: strict({
    intentId: id,
    profileId: z.enum(["alex", "camille", "maya"]),
  }),
  resolve_next_action: strict({ sessionId: id, actionId: id }),
  match_tool: strict({
    requiredCapability: id,
    profileId: id.optional(),
    currentArtifactId: id.optional(),
  }),
  connect_artifact: strict({
    sessionId: id,
    sourceArtifactId: id,
    targetArtifactId: id,
    triggerActionId: id,
  }),
  get_experience_session: strict({ sessionId: id }),
  pause_experience: strict({ sessionId: id }),
  resume_experience: strict({ sessionId: id }),
  stop_experience: strict({ sessionId: id }),
  restart_experience: strict({ sessionId: id }),
  share_experience: strict({ sessionId: id }),
} as const;

const interactionAction = z.enum([
  "artifact_viewed",
  "frame_viewed",
  "word_activated",
  "nextbound_opened",
  "action_clicked",
  "opportunity_claimed",
  "opportunity_ignored",
  "frame_dismissed",
  "navigation_returned",
]);

export const proceduralSchemas = {
  open_seed: strict({ seedId: id, recipientId: id }),
  execute_artifact_contract: strict({
    sessionId: id,
    contractId: id.optional(),
  }),
  process_interaction: strict({
    sessionId: id,
    actionType: interactionAction,
    targetId: id.optional(),
    nextboundId: id.optional(),
    frameId: id.optional(),
    dwellTimeMs: z.number().int().nonnegative().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
  resolve_nextbounds: strict({ sessionId: id }),
  get_artifact_execution: strict({ executionId: id }),
  get_session_trace: strict({ sessionId: id }),
  replay_session: strict({ seedId: id, recipientId: id, sessionId: id }),
} as const;

export const knowledgeSchemas = {
  list_local_knowledge_profiles: strict({}),
  open_local_knowledge_artifact: strict({
    profileId: id.optional(),
    seedId: id.optional(),
  }),
} as const;
