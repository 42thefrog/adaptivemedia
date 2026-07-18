export type RedditArticle = {
  id: string;
  community: string;
  title: string;
  summary: string;
  url: string;
  relevance: number;
};

export const redditArticlesByProfile: Record<string, RedditArticle[]> = {
  maya: [
    {
      id: "maya-local-llm-builds",
      community: "r/LocalLLaMA",
      title: "What are you actually building with local LLMs?",
      summary:
        "A project-focused thread with concrete examples of what developers are creating with local language models.",
      url: "https://www.reddit.com/r/LocalLLaMA/comments/1s2o8bh/what_are_you_actually_building_with_local_llms/",
      relevance: 98,
    },
    {
      id: "maya-working-on-lately",
      community: "r/LocalLLaMA",
      title: "What have you been working on lately?",
      summary:
        "An open build log for discovering current experiments, developer workflows, and project ideas from the local-AI community.",
      url: "https://www.reddit.com/r/LocalLLaMA/comments/1u8v1u7/what_have_you_been_working_on_lately/",
      relevance: 96,
    },
    {
      id: "maya-python-llm-evaluation",
      community: "r/LocalLLaMA",
      title:
        "I evaluated LLaMA and 100+ LLMs on real engineering reasoning for Python",
      summary:
        "A practical comparison of model performance on realistic Python engineering tasks and reasoning.",
      url: "https://www.reddit.com/r/LocalLLaMA/comments/1rad3hd/i_evaluated_llama_and_100_llms_on_real/",
      relevance: 94,
    },
    {
      id: "maya-local-llm-uses",
      community: "r/LocalLLaMA",
      title: "What do you guys even use local LLMs for?",
      summary:
        "Community members share useful everyday and technical applications for running language models locally.",
      url: "https://www.reddit.com/r/LocalLLaMA/comments/1szdv5s/what_do_you_guys_even_use_local_llms_for_me_a_lot/",
      relevance: 92,
    },
    {
      id: "maya-open-source-ai-wrap-up",
      community: "r/LocalLLaMA",
      title:
        "2024 Wrap-Up: What Amazing Projects Have You Built with Open-Source AI Models?",
      summary:
        "A collection of open-source AI projects, lessons, tools, and implementation ideas shared by builders.",
      url: "https://www.reddit.com/r/LocalLLaMA/comments/1h9f3ta/",
      relevance: 90,
    },
  ],
  camille: [
    {
      id: "camille-motion-branding",
      community: "r/graphic_design",
      title: "Motion Graphics for Branding",
      summary:
        "A discussion about using motion graphics to extend brand identity and visual communication.",
      url: "https://www.reddit.com/r/graphic_design/comments/1rz5ly8/motion_graphics_for_branding/",
      relevance: 98,
    },
    {
      id: "camille-motion-demand",
      community: "r/graphic_design",
      title: "Increasing demand for graphic designers that know motion design",
      summary:
        "Designers discuss how motion skills are changing creative roles, expectations, and career opportunities.",
      url: "https://www.reddit.com/r/graphic_design/comments/1p0jj1m/increasing_demand_for_graphic_designers_that_know/",
      relevance: 96,
    },
    {
      id: "camille-moving-to-motion",
      community: "r/MotionDesign",
      title: "Graphic designer trying to move into motion design",
      summary:
        "A practical transition thread about translating graphic-design foundations into a motion-design practice.",
      url: "https://www.reddit.com/r/MotionDesign/comments/1td5lnf/graphic_designer_trying_to_move_into_motion/",
      relevance: 94,
    },
    {
      id: "camille-design-motion",
      community: "r/MotionDesign",
      title: "Design > Motion?",
      summary:
        "A compact conversation about the relationship between strong design thinking and motion craft.",
      url: "https://www.reddit.com/r/MotionDesign/comments/1tvu38t/design_motion/",
      relevance: 92,
    },
    {
      id: "camille-figma-community",
      community: "r/FigmaDesign · community feed",
      title: "Figma Community",
      summary:
        "A continuously updated source of Figma workflows, interface references, resources, and design trends.",
      url: "https://www.reddit.com/r/FigmaDesign/",
      relevance: 90,
    },
  ],
  alex: [
    {
      id: "alex-startup-mistakes",
      community: "r/startups · community feed",
      title: "What mistake almost killed your startup?",
      summary:
        "Browse founder discussions about costly mistakes, survival decisions, and lessons learned while building companies.",
      url: "https://www.reddit.com/r/startups/",
      relevance: 98,
    },
    {
      id: "alex-first-customers",
      community: "r/SaaS · community feed",
      title: "How did you get your first 100 paying customers?",
      summary:
        "Explore practical SaaS conversations about early traction, sales channels, positioning, and customer acquisition.",
      url: "https://www.reddit.com/r/SaaS/",
      relevance: 96,
    },
    {
      id: "alex-building-this-week",
      community: "r/indiehackers · community feed",
      title: "What are you building this week?",
      summary:
        "A feed of active founder projects, product experiments, launch notes, and peer feedback.",
      url: "https://www.reddit.com/r/indiehackers/",
      relevance: 94,
    },
    {
      id: "alex-founders-building",
      community: "r/micro_saas",
      title: "Founders: Share what you’re building",
      summary:
        "A focused showcase of small SaaS products, founder ideas, and opportunities for useful peer feedback.",
      url: "https://www.reddit.com/r/micro_saas/comments/1t75c75/founders_share_what_youre_building/",
      relevance: 92,
    },
    {
      id: "alex-drop-startup",
      community: "r/saasbuild",
      title: "Drop your startup below",
      summary:
        "A startup discovery thread for reviewing products, positioning, pitches, and what other founders are launching.",
      url: "https://www.reddit.com/r/saasbuild/comments/1ta7r7n/drop_your_start_up_below/",
      relevance: 90,
    },
  ],
};
