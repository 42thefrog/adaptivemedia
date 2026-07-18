import { z } from "zod";
import {
  IdSchema,
  PersonalizedExperienceSchema,
  UserPersonalDataSchema,
} from "../../shared/schemas.js";
import type { ToolContract } from "./contracts.js";
export const PersonalizeIntentInput = z.object({
  intentId: IdSchema,
  personalData: UserPersonalDataSchema,
});
export const PersonalizeIntentOutput = z.object({
  experience: PersonalizedExperienceSchema,
});
export const personalizeIntentTool = {
  name: "personalize_intent",
  title: "Personalize an Intent",
  description:
    "Use transient personal data to adapt only allowed variables, preserve the author message verbatim, and disclose commercial recommendations separately.",
  inputSchema: PersonalizeIntentInput,
  outputSchema: PersonalizeIntentOutput,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
} satisfies ToolContract<
  typeof PersonalizeIntentInput,
  typeof PersonalizeIntentOutput
>;
