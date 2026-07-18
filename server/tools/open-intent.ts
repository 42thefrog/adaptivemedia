import { z } from "zod";
import { CreatorSchema, IdSchema, IntentSchema } from "../../shared/schemas.js";
import type { ToolContract } from "./contracts.js";
export const OpenIntentInput = z.object({ intentId: IdSchema });
export const OpenIntentOutput = z.object({
  intent: IntentSchema,
  creator: CreatorSchema,
  social: z.object({
    likeCount: z.number().int().nonnegative(),
    followerCount: z.number().int().nonnegative(),
  }),
});
export const openIntentTool = {
  name: "open_intent",
  title: "Open an Intent",
  description:
    "Get one published Intent, its creator, and aggregate social state.",
  inputSchema: OpenIntentInput,
  outputSchema: OpenIntentOutput,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
} satisfies ToolContract<typeof OpenIntentInput, typeof OpenIntentOutput>;
