export type NewsArticle = {
  id: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  date: string;
  relevance: number;
};

export const newsArticlesByProfile: Record<string, NewsArticle[]> = {
  maya: [
    {
      id: "maya-kimi-k3-launch",
      source: "VentureBeat",
      title:
        "China's Moonshot AI releases Kimi K3, the largest open-source model ever",
      summary:
        "Moonshot AI shipped a 2.8-trillion-parameter open-weight model with a 1M-token context window and native visual understanding, rivaling top closed U.S. systems on frontier benchmarks.",
      url: "https://venturebeat.com/technology/chinas-moonshot-ai-releases-kimi-k3-the-largest-open-source-model-ever-rivaling-top-u-s-systems",
      date: "2026-07-17",
      relevance: 98,
    },
    {
      id: "maya-together-ai-series-c",
      source: "TechCrunch",
      title: "Neocloud Together AI raises $800M, leaps to $8.3B valuation",
      summary:
        "Together AI closed an $800M Series C to keep building the infrastructure layer for open models like DeepSeek, Nemotron, and Kimi, reporting over $1.15B in annual bookings.",
      url: "https://techcrunch.com/2026/07/01/neocloud-together-ai-raises-800m-leaps-to-8-3b-valuation/",
      date: "2026-07-01",
      relevance: 95,
    },
    {
      id: "maya-kimi-k3-frontend-arena",
      source: "Tom's Hardware",
      title:
        "China's 2.8-trillion-parameter Kimi K3 beats Claude Fable 5 in Frontend Code Arena benchmark",
      summary:
        "In blind testing, developers preferred Kimi K3's front-end coding output over every leading U.S. model, even as it still trails on overall performance.",
      url: "https://www.tomshardware.com/tech-industry/artificial-intelligence/moonshot-releases-2-8-trillion-parameter-kimi-k3",
      date: "2026-07-17",
      relevance: 93,
    },
    {
      id: "maya-local-llm-build-guide",
      source: "AI Weekly",
      title: "James O'Beirne publishes local-LLM build guide for July 2026",
      summary:
        "A practical two-tier hardware guide for running frontier open-weight models locally, from a ~$2K Qwen3.6-27B rig to a ~$40K GLM-5.2 build.",
      url: "https://aiweekly.co/alerts/james-obeirne-publishes-local-llm-build-guide-for-july-2026",
      date: "2026-07-14",
      relevance: 90,
    },
    {
      id: "maya-best-open-source-llms",
      source: "TECHSY",
      title: "Best Open-Source LLMs: July 2026 Leaderboard",
      summary:
        "A ranked roundup of the current open-weight frontier — GLM-5.2, Kimi K2.7 Code, Gemma 4 12B, and Nemotron 3 Super — with notes on coding, laptop-friendly, and open-training picks.",
      url: "https://techsy.io/en/blog/best-open-source-llms-2026",
      date: "2026-07-10",
      relevance: 88,
    },
  ],
  camille: [
    {
      id: "camille-figma-config-2026",
      source: "Figma Blog",
      title: "Config 2026: New Materials, New Tools and a More Expressive Canvas",
      summary:
        "Figma's official recap of Config 2026, covering Code Layers, Figma Motion, shader fills, generative plugins, and the expanded Figma agent with team-shareable skills.",
      url: "https://www.figma.com/blog/config-2026-recap/",
      date: "2026-06-25",
      relevance: 98,
    },
    {
      id: "camille-figma-code-layers-motion",
      source: "CMSWire",
      title: "Figma Launches Code Layers & Motion at Config 2026",
      summary:
        "A breakdown of Figma's push toward a single workspace where design, code, motion, and AI live in the same file, including a built-in timeline for keyframed motion.",
      url: "https://www.cmswire.com/digital-experience/figma-launches-code-layers-motion-at-config-2026/",
      date: "2026-06-26",
      relevance: 95,
    },
    {
      id: "camille-graphic-design-texture-trend",
      source: "Creative Bloq",
      title:
        "Texture, warmth and tactile rebellion: the big graphic design trends for 2026",
      summary:
        "Designers are pulling back from digital perfection toward grain, collage, and handmade imperfection as a response to an increasingly synthetic visual landscape.",
      url: "https://www.creativebloq.com/design/graphic-design/texture-warmth-and-tactile-rebellion-the-big-graphic-design-trends-for-2026",
      date: "2026-01-08",
      relevance: 92,
    },
    {
      id: "camille-motion-design-trends",
      source: "MonkyVision",
      title: "Top 12 Motion Design Trends You Must Know in 2026",
      summary:
        "Motion has moved from enhancement to core branding language, with micro-interactions, cinematic transitions, and adaptive identity systems leading the list.",
      url: "https://monkyvision.com/blog/motion-design-trends/",
      date: "2026-02-03",
      relevance: 90,
    },
    {
      id: "camille-branding-trends-2026",
      source: "The Branding Journal",
      title: "Top Branding & Design Trends For 2026",
      summary:
        "A survey of the identity systems shaping this year's branding work — variable color themes, elastic typography, and modular frameworks built for adaptability over strict consistency.",
      url: "https://www.thebrandingjournal.com/2026/01/top-branding-design-trends-2026/",
      date: "2026-01-15",
      relevance: 87,
    },
  ],
  alex: [
    {
      id: "alex-bending-spoons-ipo",
      source: "TechCrunch",
      title: "Bending Spoons defies SaaS slump, surges 40% on first day of trading",
      summary:
        "Shares of the serial acquirer of legacy tech brands like Evernote and Vimeo closed nearly 40% above its IPO price, a rare bright spot in a rough year for SaaS listings.",
      url: "https://techcrunch.com/2026/07/01/bending-spoons-defies-saas-slump-surges-40-on-first-day-of-trading/",
      date: "2026-07-01",
      relevance: 97,
    },
    {
      id: "alex-twelvelabs-series-b",
      source: "GlobeNewswire",
      title: "TwelveLabs Raises $100 Million in Series B Funding to Build Video Superintelligence",
      summary:
        "The video-AI startup landed a $100M round co-led by NEA and NAVER Ventures, plus a multiyear AWS partnership, on its way to a full-stack agentic video platform.",
      url: "https://www.globenewswire.com/news-release/2026/07/01/3320545/0/en/twelvelabs-raises-100-million-in-series-b-funding-to-build-video-superintelligence.html",
      date: "2026-07-01",
      relevance: 94,
    },
    {
      id: "alex-saas-worst-first-idea",
      source: "Tech Startups",
      title: "Why Building a SaaS Is the Worst Startup Idea for Most First-Time Founders",
      summary:
        "A contrarian look at why more than 90% of SaaS projects fail — mostly because founders spend months building before proving anyone wants the product.",
      url: "https://techstartups.com/2026/07/11/why-building-a-saas-is-the-worst-startup-idea-for-most-first-time-founders/",
      date: "2026-07-11",
      relevance: 91,
    },
    {
      id: "alex-together-ai-series-c",
      source: "TechCrunch",
      title: "Neocloud Together AI raises $800M, leaps to $8.3B valuation",
      summary:
        "A case study in infrastructure-layer company building: Together AI more than doubled its valuation on the bet that enterprises will keep shifting workloads to open models.",
      url: "https://techcrunch.com/2026/07/01/neocloud-together-ai-raises-800m-leaps-to-8-3b-valuation/",
      date: "2026-07-01",
      relevance: 89,
    },
    {
      id: "alex-saas-founders-2026",
      source: "DevSquad",
      title: "20 SaaS Founders Shaping the Future of Software in 2026",
      summary:
        "Profiles of founders building through the current SaaS slump, including how Webflow scaled to nearly $130M in annual revenue as a visual development platform.",
      url: "https://devsquad.com/blog/saas-founder",
      date: "2026-06-20",
      relevance: 86,
    },
  ],
};
