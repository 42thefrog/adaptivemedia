import { z } from "zod";
import { FollowSchema, IdSchema } from "../../shared/schemas.js";
import type { ToolContract } from "./contracts.js";
export const FollowCreatorInput = z.object({
  actorId: IdSchema,
  creatorId: IdSchema,
  active: z.boolean().default(true),
});
export const FollowCreatorOutput = z.object({
  active: z.boolean(),
  follow: FollowSchema.nullable(),
  followerCount: z.number().int().nonnegative(),
});
export const followCreatorTool = {
  name: "follow_creator",
  title: "Follow or unfollow a creator",
  description: "Set the current actor's follow state for a creator.",
  inputSchema: FollowCreatorInput,
  outputSchema: FollowCreatorOutput,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
} satisfies ToolContract<typeof FollowCreatorInput, typeof FollowCreatorOutput>;
