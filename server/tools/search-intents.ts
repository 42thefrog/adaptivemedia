import { z } from "zod";
import { CreatorSchema, IntentSchema } from "../../shared/schemas.js";
import type { ToolContract } from "./contracts.js";
export const SearchIntentsInput = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).default(10),
});
export const SearchIntentsOutput = z.object({
  matches: z.array(
    z.object({
      intent: IntentSchema,
      creator: CreatorSchema,
      score: z.number().min(0).max(1),
      reason: z.string(),
    }),
  ),
});
export const searchIntentsTool = {
  name: "search_intents",
  title: "Search public Intents",
  description:
    "Find published public creator Intents relevant to a user's stated goal.",
  inputSchema: SearchIntentsInput,
  outputSchema: SearchIntentsOutput,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
} satisfies ToolContract<typeof SearchIntentsInput, typeof SearchIntentsOutput>;
