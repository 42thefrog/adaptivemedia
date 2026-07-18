import { z } from "zod";
import { IdSchema } from "../../shared/schemas.js";

const Strict = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();
const PersonaId = z.enum(["alex", "camille", "maya"]);

export const SearchPublicIntentsInput = Strict({
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional(),
});
export const GetCreatorProfileInput = Strict({ creatorId: IdSchema });
export const GetIntentInput = Strict({ intentId: IdSchema });
export const GenerateExperienceInput = Strict({
  intentId: IdSchema,
  personaId: PersonaId,
});
export const LikeIntentInput = Strict({
  intentId: IdSchema,
  liked: z.boolean(),
});
export const FollowCreatorInput = Strict({
  creatorId: IdSchema,
  following: z.boolean(),
});
export const SaveExperienceInput = Strict({
  experienceId: IdSchema,
  saved: z.boolean(),
});
export const CreateShareLinkInput = Strict({ experienceId: IdSchema });

export const toolSchemas = {
  search_public_intents: SearchPublicIntentsInput,
  get_creator_profile: GetCreatorProfileInput,
  get_intent: GetIntentInput,
  generate_experience: GenerateExperienceInput,
  like_intent: LikeIntentInput,
  follow_creator: FollowCreatorInput,
  save_experience: SaveExperienceInput,
  create_share_link: CreateShareLinkInput,
} as const;
