import { z } from "zod";
import {
  AdaptationRulesSchema,
  ApprovedPartnerSchema,
  IdSchema,
  ImmutableMessageSchema,
  IntentSchema,
  ResourceSchema,
} from "../../shared/schemas.js";
import type { ToolContract } from "./contracts.js";
export const CreateIntentInput = z.object({
  creatorId: IdSchema,
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(2_000),
  goal: z.string().min(1).max(1_000),
  immutableMessage: ImmutableMessageSchema,
  adaptationRules: AdaptationRulesSchema,
  resources: z.array(ResourceSchema).max(100).default([]),
  approvedPartners: z.array(ApprovedPartnerSchema).max(50).default([]),
  visibility: z.enum(["public", "unlisted", "private"]).default("private"),
  publish: z.boolean().default(false),
});
export const CreateIntentOutput = z.object({ intent: IntentSchema });
export const createIntentTool = {
  name: "create_intent",
  title: "Create an Intent",
  description:
    "Create an Intent with isolated immutable author content, adaptation rules, resources, and disclosed partners.",
  inputSchema: CreateIntentInput,
  outputSchema: CreateIntentOutput,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
} satisfies ToolContract<typeof CreateIntentInput, typeof CreateIntentOutput>;
