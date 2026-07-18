import { z } from "zod";
import { IdSchema, LikeSchema } from "../../shared/schemas.js";
import type { ToolContract } from "./contracts.js";
export const LikeIntentInput = z.object({
  actorId: IdSchema,
  intentId: IdSchema,
  active: z.boolean().default(true),
});
export const LikeIntentOutput = z.object({
  active: z.boolean(),
  like: LikeSchema.nullable(),
  likeCount: z.number().int().nonnegative(),
});
export const likeIntentTool = {
  name: "like_intent",
  title: "Like or unlike an Intent",
  description: "Set the current actor's like state for an Intent.",
  inputSchema: LikeIntentInput,
  outputSchema: LikeIntentOutput,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
} satisfies ToolContract<typeof LikeIntentInput, typeof LikeIntentOutput>;
