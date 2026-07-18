import { AdaptiveMediaService, DemoError } from "../../server/service.js";

const service = new AdaptiveMediaService();

const tools: Record<string, (args: any) => Record<string, unknown>> = {
  search_public_intents: (args) => service.searchPublicIntents(args),
  get_creator_profile: ({ creatorId }) => service.getCreatorProfile(creatorId),
  get_intent: ({ intentId }) => service.getIntent(intentId),
  generate_experience: ({ intentId, personaId }) =>
    service.generateExperience(intentId, personaId),
  like_intent: ({ intentId, liked }) => service.likeIntent(intentId, liked),
  follow_creator: ({ creatorId, following }) =>
    service.followCreator(creatorId, following),
  save_experience: ({ experienceId, saved }) =>
    service.saveExperience(experienceId, saved),
  create_share_link: ({ experienceId }) =>
    service.createShareLink(experienceId),
};

export function installLocalPreview() {
  if (window.openai) return false;

  window.openai = {
    toolOutput: service.searchPublicIntents({ query: "" }),
    callTool: async (name, args) => {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      try {
        const handler = tools[name];
        if (!handler)
          throw new DemoError(
            "unknown_tool",
            "This demo action is unavailable.",
          );
        return { structuredContent: handler(args) };
      } catch (error) {
        return {
          structuredContent: {
            error: {
              code: error instanceof DemoError ? error.code : "preview_error",
              message:
                error instanceof DemoError
                  ? error.message
                  : "The preview could not complete that action.",
            },
          },
        };
      }
    },
    setWidgetState: (state) => {
      window.openai!.widgetState = state;
    },
  };
  return true;
}
