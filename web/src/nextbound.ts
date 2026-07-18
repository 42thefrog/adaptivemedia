import Alpine from "alpinejs";
import { createNextboundTransport } from "./nextbound-transport.js";
import { profiles } from "../../nextbound/fixtures.js";
import type {
  CompiledExperience,
  ArtifactExecution,
  ExperienceSession,
  InboxMessage,
  NormalizedContext,
} from "../../nextbound/types.js";
import type {
  ArtifactExecution as RuntimeExecution,
  ArtifactMutation,
  ExperienceSession as RuntimeSession,
  Nextbound as RuntimeNextbound,
} from "../../nextbound/runtime.js";
import {
  commonsContributions,
  commonsEvents,
  commonsObject,
  resolveCollaborativeVisualField,
} from "../../nextbound/collaboration.js";
import { continuousContracts } from "../../nextbound/runtime.js";
import { redditArticlesByProfile } from "./reddit-articles.js";
import { newsArticlesByProfile } from "./news-articles.js";
import { initTeamGames } from "./team-games.js";
import "./nextbound.css";

type PersonaId = "maya" | "camille" | "alex";
type DesignMode =
  | "wireframe"
  | "minimal"
  | "glass"
  | "brutalist"
  | "playful"
  | "swiss"
  | "bauhaus"
  | "editorial"
  | "bento"
  | "material"
  | "neobrutalist"
  | "clay"
  | "neumorphic"
  | "y2k"
  | "cyberpunk"
  | "retrofuturist";
type UserVisualStyle = "primary" | "secondary" | "ambient";

const personaDesignPresets: Record<
  PersonaId,
  { designMode: DesignMode; userVisualStyle: UserVisualStyle }
> = {
  maya: { designMode: "retrofuturist", userVisualStyle: "primary" },
  camille: { designMode: "playful", userVisualStyle: "primary" },
  alex: { designMode: "neumorphic", userVisualStyle: "secondary" },
};

const personaPreset = (id: string) =>
  personaDesignPresets[id as PersonaId] ?? personaDesignPresets.maya;

const commonsParticipantConfig = [
  {
    id: "maya",
    contractId: "multiplayer-snake",
    label: "Maya · Multiplayer Snake",
  },
  { id: "noa", contractId: "living-canvas", label: "Noa · Living Canvas" },
  {
    id: "elias",
    contractId: "constraint-room",
    label: "Elias · Constraint Room",
  },
] as const;

const creatorVideos = {
  maya: [
    { id: "pEfrdAtAmqk", orientation: "landscape" as const, score: 96 },
    { id: "CvQ7e6yUtnw", orientation: "landscape" as const, score: 82 },
    { id: "cliZ-VzQxkE", orientation: "landscape" as const, score: 68 },
    { id: "w7i4amO_zaE", orientation: "landscape" as const, score: 89 },
    { id: "7xTGNNLPyMI", orientation: "landscape" as const, score: 57 },
    { id: "lwLLFbC1H0c", orientation: "portrait" as const, score: 92 },
    {
      id: "sc-maya-code-fi",
      kind: "audio" as const,
      url: "https://soundcloud.com/chill-playlister/sets/lo-fi-coding-code-fi",
      title: "Lo-Fi Coding — Code-Fi",
      artist: "Chill Playlister",
      cover: "https://i1.sndcdn.com/artworks-000968525197-i8n52a-t500x500.jpg",
      orientation: "landscape" as const,
      score: 94,
    },
    {
      id: "sc-maya-deep-focus",
      kind: "audio" as const,
      url: "https://soundcloud.com/programmingandcodingmusicclub/deep-focus-lo-fi-beats",
      title: "Deep Focus (Lo-Fi Beats)",
      artist: "Programming and Coding Music Club",
      cover: "https://i1.sndcdn.com/artworks-eXq1rTaAgpjN-0-t500x500.jpg",
      orientation: "landscape" as const,
      score: 88,
    },
    {
      id: "sc-maya-house-focus",
      kind: "audio" as const,
      url: "https://soundcloud.com/jamiethomsonmusic/lofi-house-mix-study-focus",
      title: "Lofi House Mix: Study & Focus",
      artist: "Jamie Thomson",
      cover:
        "https://i1.sndcdn.com/artworks-1zxIztde6RYy4fHl-kkpPyA-t500x500.jpg",
      orientation: "landscape" as const,
      score: 81,
    },
  ],
  camille: [
    { id: "U__YrDLoHRw", orientation: "landscape" as const, score: 91 },
    { id: "hb2bbfiNBXA", orientation: "landscape" as const, score: 73 },
    { id: "wG8gYDWj-mg", orientation: "landscape" as const, score: 62 },
    { id: "wCkM5zJooYY", orientation: "landscape" as const, score: 87 },
    { id: "lwLLFbC1H0c", orientation: "portrait" as const, score: 95 },
    {
      id: "sc-camille-eclectic",
      kind: "audio" as const,
      url: "https://soundcloud.com/eclectic_music",
      title: "Eclectic Music",
      artist: "Eclectic Music",
      cover: "https://i1.sndcdn.com/avatars-000154967109-jjmp4f-t500x500.jpg",
      orientation: "landscape" as const,
      score: 90,
    },
    {
      id: "sc-camille-moodboards",
      kind: "audio" as const,
      url: "https://soundcloud.com/moodboards",
      title: "Moodboards",
      artist: "Moodboards",
      cover: "https://i1.sndcdn.com/avatars-000633832893-oahmy3-t500x500.jpg",
      orientation: "landscape" as const,
      score: 85,
    },
  ],
  alex: [
    { id: "8JoTw_JuE78", orientation: "landscape" as const, score: 98 },
    { id: "4ef0juAMqoE", orientation: "square" as const, score: 78 },
    { id: "0FI11AKM5PY", orientation: "square" as const, score: 64 },
    { id: "A3AsVAZ7wIs", orientation: "square" as const, score: 53 },
    { id: "wsTLVCGwuDY", orientation: "landscape" as const, score: 88 },
    { id: "E0Q96IKXx6Q", orientation: "square" as const, score: 70 },
    { id: "lwLLFbC1H0c", orientation: "portrait" as const, score: 85 },
    {
      id: "sc-alex-entvibes",
      kind: "audio" as const,
      url: "https://soundcloud.com/evan-carmichael/sets/entvibes-productivity-music-to",
      title: "#EntVibes — Productivity Music",
      artist: "Evan Carmichael",
      cover: "https://i1.sndcdn.com/artworks-000309769560-jhv2jo-t500x500.jpg",
      orientation: "landscape" as const,
      score: 93,
    },
    {
      id: "sc-alex-office",
      kind: "audio" as const,
      url: "https://soundcloud.com/softofficemusic/sets/music-for-work-productivity",
      title: "Music for Work — Productivity",
      artist: "Soft Office Music",
      cover:
        "https://i1.sndcdn.com/artworks-1056b73d-eabd-4332-8fef-3546f45d9fb7-0-t500x500.jpg",
      orientation: "landscape" as const,
      score: 84,
    },
    {
      id: "sc-alex-robbins",
      kind: "audio" as const,
      url: "https://soundcloud.com/evan-carmichael/tony-robbins-motivation-productive-music-playlist-1-hour-mix-february-2018-entvibes",
      title: "Tony Robbins Motivation Mix",
      artist: "Evan Carmichael",
      cover: "https://i1.sndcdn.com/artworks-000309773547-usw40q-t500x500.jpg",
      orientation: "landscape" as const,
      score: 79,
    },
  ],
} as const;

// Real, sourced data: Macrotrends, MSFT year-end close prices
// (https://www.macrotrends.net/stocks/charts/MSFT/microsoft/stock-price-history),
// checked July 2026. OpenAI itself has no public stock — MSFT is its largest
// outside investor, so it stands in as an honestly-labelled real chart
// instead of inventing "OpenAI" price data.
const msftYearlyClose = [
  { year: 2020, close: 212.48 },
  { year: 2021, close: 323.98 },
  { year: 2022, close: 233.18 },
  { year: 2023, close: 368.87 },
  { year: 2024, close: 416.56 },
  { year: 2025, close: 481.48 },
  { year: 2026, close: 395.63, partial: true },
] as const;
const msftSnapshot = {
  price: 395.63,
  asOf: "Jul 15, 2026",
  changeYtd: -17.83,
  low52w: 349.2,
  high52w: 555.45,
  source: "Macrotrends",
} as const;

const moodboardImages = [
  {
    id: "mb-1",
    url: "/moodboard/camille/studio-board.png",
    label: "Pinned studio references with objects, swatches and silhouettes",
    tag: "studio wall",
    position: "center",
  },
  {
    id: "mb-2",
    url: "/moodboard/camille/abstract-field.png",
    label: "Landscape collage with olive, amber and translucent geometry",
    tag: "palette",
    position: "center",
  },
  {
    id: "mb-3",
    url: "/moodboard/camille/red-tulip-set.png",
    label: "Red floral couture set with dense textile backdrop",
    tag: "floral set",
    position: "center",
  },
  {
    id: "mb-4",
    url: "/moodboard/camille/blue-floral-couture.png",
    label: "Blue flower silhouette with painterly couture volume",
    tag: "couture",
    position: "center",
  },
  {
    id: "mb-5",
    url: "/moodboard/camille/runner-roses.png",
    label: "Motion study with roses, dress and saturated open sky",
    tag: "movement",
    position: "center",
  },
  {
    id: "mb-6",
    url: "/moodboard/camille/pink-forest.png",
    label: "Surreal forest walk through oversized pink mushroom forms",
    tag: "surreal",
    position: "center",
  },
  {
    id: "mb-7",
    url: "/moodboard/camille/cyan-floral-couture.png",
    label: "Cyan floral volume and soft sculptural fabric",
    tag: "texture",
    position: "center",
  },
  {
    id: "mb-8",
    url: "/moodboard/camille/pink-monochrome.png",
    label: "Monochrome pink fashion world with birds and foliage",
    tag: "monochrome",
    position: "center top",
  },
] as const;

const moodMusicByProfile = {
  alex: {
    track: "/music/alex-techno.mp3",
    title: "Alex - Techno",
  },
  camille: {
    track: "/music/velvet-and-neon-camille.m4a",
    title: "Velvet and Neon",
  },
  maya: {
    track: "/music/maya-15s.mp3",
    title: "Maya 15s",
  },
} as const;

const storyFrameComponents = [
  [
    {
      type: "signal",
      title: "Trace provenance",
      body: "Maya · source gesture · revision 01",
    },
    { type: "passage", title: "Enter Living Canvas", target: "living-canvas" },
  ],
  [
    {
      type: "memory",
      title: "Canvas memory",
      body: "Noa retained 72% of the originating line.",
    },
    {
      type: "passage",
      title: "Open shared archive",
      target: "collaborative-artifact",
    },
  ],
  [
    {
      type: "constraint",
      title: "Constraint released",
      body: "Elias opened one controlled degree of freedom.",
    },
    {
      type: "passage",
      title: "Enter Constraint Room",
      target: "constraint-room",
    },
  ],
] as const;

const commonsComposites = commonsParticipantConfig.map((participant) => {
  const local = commonsContributions[participant.id];
  return {
    ...participant,
    field: resolveCollaborativeVisualField({
      localVisualRecipe: {
        participantId: participant.id,
        sessionColor: local.sessionColor,
        typographyRole: local.typographyRole,
        shapeLanguage: local.shapeLanguage,
        textureLanguage: local.textureLanguage,
        motionSignature: local.motionSignature,
      },
      remoteVisualContributions: Object.values(commonsContributions).filter(
        (item) => item.participantId !== participant.id,
      ),
      sharedObjects: [commonsObject],
      recentCollaborativeEvents: commonsEvents,
      contractPolicy:
        continuousContracts[participant.contractId].collaboration!,
    }),
  };
});

Alpine.data("nextbound", () => ({
  transport: createNextboundTransport(
    (window as any).__NEXTBOUND_MODE__ === "mcp" ? "mcp" : "local-preview",
  ),
  loading: false,
  error: "",
  share: null as any,
  profiles,
  profileId: "camille",
  designMode: personaDesignPresets.camille.designMode,
  userVisualStyle: personaDesignPresets.camille.userVisualStyle,
  inbox: [] as InboxMessage[],
  context: null as NormalizedContext | null,
  experience: null as CompiledExperience | null,
  session: null as ExperienceSession | null,
  debug: false,
  teamGame: true,
  teamGamePlayers: [] as string[],
  teamGameInviteName: "",
  loopMode:
    Boolean((window as any).__NEXTBOUND_ARTIFACT__) ||
    new URLSearchParams(window.location.search).get("scenario") ===
      "procedural-loop",
  transition: null as null | {
    from: ArtifactExecution;
    to: ArtifactExecution;
    indicator: string;
    navigationRequired: false;
  },
  lastTransition: null as null | {
    from: ArtifactExecution;
    to: ArtifactExecution;
    indicator: string;
    navigationRequired: false;
  },
  transitionStage: "idle" as "idle" | "holding" | "morphing" | "complete",
  runtimeSession: null as RuntimeSession | null,
  runtimeExecution: null as RuntimeExecution | null,
  runtimePreviousVisual: null as RuntimeExecution | null,
  runtimeMutations: [] as ArtifactMutation[],
  feedArchive: [] as Array<{
    id: string;
    contractId: string;
    title: string;
    summary: string;
    accent: string;
    visitNumber: number;
  }>,
  widgetBranches: [] as Array<{
    id: string;
    parentSchemaId: string;
    direction: "left" | "right" | "up" | "down";
    title: string;
    content: string;
  }>,
  nextboundPreviews: [] as Array<{
    id: string;
    nextboundId: string;
    targetContractId: string;
    direction: "left" | "right" | "up" | "down";
    title: string;
  }>,
  runtimeTrace: null as any,
  runtimeTransitionStage: "idle" as
    "idle" | "holding" | "morphing" | "complete",
  focusedFrameId: "",
  storyIndex: 0,
  storyFrameComponents,
  redditArticlesByProfile,
  newsArticlesByProfile,
  focusedContentId: "",
  creatorVideos,
  playingVideoId: "",
  discussionVideoId: "",
  discussionDraft: "",
  discussionReplies: {} as Record<string, string[]>,
  // Maya: a simulated terminal. It runs a small fixed set of commands
  // client-side — there is no real shell behind it (this is a static
  // frontend prototype, not a place to wire up arbitrary command
  // execution), but it's genuinely interactive: type, Enter, get output,
  // arrow-key history, same as a real terminal session would feel.
  terminalHistory: [
    { type: "output", text: "nextbound-dev on maya · type `help`" },
  ] as Array<{ type: "input" | "output"; text: string }>,
  terminalInput: "",
  terminalPast: [] as string[],
  terminalPastIndex: -1,
  runTerminalCommand() {
    const raw = this.terminalInput;
    const cmd = raw.trim();
    this.terminalHistory.push({ type: "input", text: cmd || " " });
    if (cmd) {
      this.terminalPast.push(cmd);
      this.terminalPastIndex = this.terminalPast.length;
    }
    this.terminalInput = "";
    const [name, ...args] = cmd.split(/\s+/);
    const out = (text: string) =>
      this.terminalHistory.push({ type: "output", text });
    switch ((name || "").toLowerCase()) {
      case "":
        break;
      case "help":
        out(
          "help · whoami · ls · cat afterlight.md · git status · npm run dev:nextbound · match · clear",
        );
        break;
      case "whoami":
        out("maya · developer student · r/LocalLLaMA");
        break;
      case "ls":
        out(
          "afterlight.md  nextbound.ts  reddit-articles.ts  package.json  node_modules/",
        );
        break;
      case "cat":
        out(
          args[0] === "afterlight.md"
            ? '"What we remember is not what happened. It is what the moment became inside us."'
            : `cat: ${args[0] || "(missing file)"}: No such file`,
        );
        break;
      case "git":
        out(
          args[0] === "status"
            ? "On branch main\nnothing to commit, working tree clean"
            : `git: '${args[0] || ""}' is not a git command`,
        );
        break;
      case "npm":
        out(
          args.join(" ") === "run dev:nextbound"
            ? "VITE ready — Local: http://127.0.0.1:4174/"
            : `npm: unknown script or command`,
        );
        break;
      case "match":
        out(
          this.redditArticlesByProfile[this.profileId]?.[0]?.title
            ? `top match: "${this.redditArticlesByProfile[this.profileId][0].title}" · ${this.redditArticlesByProfile[this.profileId][0].relevance}%`
            : "no matches indexed for this profile",
        );
        break;
      case "clear":
        this.terminalHistory = [];
        break;
      default:
        out(`command not found: ${name} (try 'help')`);
    }
    this.$nextTick(() => {
      const feed = document.querySelector(".terminal-feed");
      feed?.scrollTo({ top: feed.scrollHeight });
    });
  },
  terminalHistoryUp() {
    if (!this.terminalPast.length) return;
    this.terminalPastIndex = Math.max(0, this.terminalPastIndex - 1);
    this.terminalInput = this.terminalPast[this.terminalPastIndex] ?? "";
  },
  terminalHistoryDown() {
    if (!this.terminalPast.length) return;
    this.terminalPastIndex = Math.min(
      this.terminalPast.length,
      this.terminalPastIndex + 1,
    );
    this.terminalInput = this.terminalPast[this.terminalPastIndex] ?? "";
  },
  // Camille: a pinboard. Click an image to pin it to the "selects" rail —
  // pure client state, no backend, but a real interaction (not decorative).
  moodboardImages,
  moodboardPinned: [] as string[],
  toggleMoodboardPin(id: string) {
    this.moodboardPinned = this.moodboardPinned.includes(id)
      ? this.moodboardPinned.filter((x: string) => x !== id)
      : [...this.moodboardPinned, id];
  },
  moodboardTileStyle(image: (typeof moodboardImages)[number]) {
    return `--moodboard-image:url("${image.url}");--moodboard-position:${image.position}`;
  },
  // Alex: MSFT is OpenAI's largest outside investor and the closest real,
  // publicly-traded proxy — OpenAI itself has no ticker. Numbers are a real
  // sourced snapshot (see msftYearlyClose/msftSnapshot above), not live.
  msftYearlyClose,
  msftSnapshot,
  msftChartPoints() {
    const values = msftYearlyClose.map((p) => p.close);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const w = 100;
    const h = 40;
    return msftYearlyClose
      .map((p, i) => {
        const x = (i / (msftYearlyClose.length - 1)) * w;
        const y = h - ((p.close - min) / (max - min || 1)) * (h - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  },
  chatExpanded: false,
  imageSaved: false,
  moodMusicStatus: "idle" as "idle" | "generating" | "ready",
  moodMusicPlaying: false,
  moodMusicTrack: moodMusicByProfile.camille.track,
  moodMusicTitle: moodMusicByProfile.camille.title,
  reactionSequence: 0,
  floatingReactions: [] as Array<{
    id: string;
    symbol: string;
    x: number;
    y: number;
    dx: number;
    dy: number;
    hue: number;
  }>,
  gameScore: 0,
  gameTarget: 0,
  lockCollected: false,
  parisPartnerJoined: false,
  lockAttached: false,
  lockSeedVisits: 0,
  lockSeedVisitor: "",
  kineticReady: false,
  spawnedWidgets: [] as Array<{
    id: string;
    source: string;
    title: string;
    text: string;
    direction: "left" | "right" | "up" | "down";
    symbol: string;
  }>,
  warpOpen: false,
  warpInvitedUser: "",
  warpConsumed: false,
  warpVisit: 0,
  postItSequence: 3,
  postIts: [
    {
      id: "note-0",
      text: "Make the trace audible",
      color: "yellow",
      active: false,
    },
    {
      id: "note-1",
      text: "Release one constraint",
      color: "pink",
      active: true,
    },
    {
      id: "note-2",
      text: "Return through memory",
      color: "blue",
      active: false,
    },
  ],
  frameObserver: null as IntersectionObserver | null,
  widgetResizeObserver: null as ResizeObserver | null,
  videoFloating: false,
  videoFloatObserver: null as IntersectionObserver | null,
  videoScrollHandler: null as (() => void) | null,
  commonsComposites,
  async init() {
    if (this.loopMode) {
      await this.initProceduralRuntime();
      return;
    }
    await this.run(async () => {
      await this.transport.call("publish_intent", { intentId: "afterlight" });
      const delivered: any = await this.transport.call("deliver_to_inbox", {
        intentId: "afterlight",
        profileIds: ["camille", "alex", "maya"],
      });
      this.inbox = delivered.deliveries;
      await this.selectProfile("camille");
    });
  },
  async initProceduralRuntime() {
    await this.run(async () => {
      const opened: any = await this.transport.call("open_seed", {
        seedId: `seed-afterlight-${this.profileId}`,
        recipientId: this.profileId,
      });
      this.runtimeSession = opened.session;
      this.runtimeExecution = opened.execution;
      this.runtimePreviousVisual = opened.execution;
      this.runtimeTrace = await this.transport.call("get_session_trace", {
        sessionId: opened.session.id,
      });
    });
    this.observeRuntimeFrames();
    this.layoutWidgetBoard();
    this.setupKineticCanvas();
  },
  setupKineticCanvas() {
    if (this.kineticReady) return;
    this.kineticReady = true;
    requestAnimationFrame(() => {
      const board = document.querySelector<HTMLElement>(".runtime-demo");
      if (!board) return;

      // Cache widget rects instead of calling getBoundingClientRect() (a
      // forced-layout read) for every widget on every single pointermove —
      // that was 30+ synchronous reflows per mouse tick, which is what made
      // scrolling (and the video shrink transition) feel laggy. Rects are
      // measured once, refreshed on scroll/resize (rAF-throttled), and the
      // pointermove handler itself only ever reads from the cache and writes
      // transform-only CSS variables, so it never forces layout.
      let widgetRects: { widget: HTMLElement; rect: DOMRect }[] = [];
      let ticking = false;
      let pendingPointer: { x: number; y: number } | null = null;

      const measure = () => {
        widgetRects = Array.from(
          board.querySelectorAll<HTMLElement>("[data-widget]"),
        ).map((widget) => ({ widget, rect: widget.getBoundingClientRect() }));
      };
      measure();

      let measureQueued = false;
      const queueMeasure = () => {
        if (measureQueued) return;
        measureQueued = true;
        requestAnimationFrame(() => {
          measureQueued = false;
          measure();
        });
      };
      window.addEventListener("scroll", queueMeasure, { passive: true });
      window.addEventListener("resize", queueMeasure, { passive: true });

      const applyRepel = () => {
        ticking = false;
        if (!pendingPointer) return;
        const { x: px, y: py } = pendingPointer;
        for (const { widget, rect } of widgetRects) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = cx - px;
          const dy = cy - py;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const force = Math.max(0, 1 - distance / 360);
          widget.style.setProperty(
            "--repel-x",
            `${(dx / distance) * force * 34}px`,
          );
          widget.style.setProperty(
            "--repel-y",
            `${(dy / distance) * force * 28}px`,
          );
          widget.style.setProperty("--repel-scale", `${1 + force * 0.025}`);
        }
      };

      board.addEventListener(
        "pointermove",
        (event) => {
          const pointer = event as PointerEvent;
          pendingPointer = { x: pointer.clientX, y: pointer.clientY };
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(applyRepel);
          }
        },
        { passive: true },
      );
      board.addEventListener(
        "pointerleave",
        () => {
          pendingPointer = null;
          for (const { widget } of widgetRects) {
            widget.style.setProperty("--repel-x", "0px");
            widget.style.setProperty("--repel-y", "0px");
            widget.style.setProperty("--repel-scale", "1");
          }
        },
        { passive: true },
      );
      board.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button,select,a,input")) return;
        const widget = target.closest<HTMLElement>("[data-widget]");
        if (widget)
          this.spawnKineticFragment(widget.dataset.widget ?? "artifact");
      });
    });
  },
  spawnKineticFragment(source = "artifact") {
    const directions = ["left", "right", "up", "down"] as const;
    const symbols = ["✦", "◌", "↗", "⊹", "∞"];
    const sequence = this.spawnedWidgets.length;
    const direction = directions[sequence % directions.length];
    this.spawnedWidgets.push({
      id: `kinetic-${Date.now()}-${sequence}`,
      source,
      direction,
      symbol: symbols[sequence % symbols.length],
      title: `${source} released a new frame`,
      text: `This ${direction}-moving fragment inherits the source interaction and can split again.`,
    });
    if (this.spawnedWidgets.length > 8) this.spawnedWidgets.shift();
    this.emitReaction(symbols[sequence % symbols.length]);
    requestAnimationFrame(() => {
      const fragments =
        document.querySelectorAll<HTMLElement>(".kinetic-fragment");
      const fragment = fragments[fragments.length - 1];
      fragment?.animate(
        [
          {
            opacity: 0,
            transform: `translate(${direction === "left" ? "90px" : direction === "right" ? "-90px" : "0"},${direction === "up" ? "80px" : direction === "down" ? "-80px" : "0"}) scale(.72) rotate(-4deg)`,
          },
          { opacity: 1, transform: "translate(0,0) scale(1) rotate(0)" },
        ],
        {
          duration: 720,
          easing: "cubic-bezier(.16,.88,.24,1.18)",
          fill: "both",
        },
      );
    });
  },
  openWarp() {
    if (this.warpConsumed) return;
    this.warpOpen = true;
    this.emitReaction("🌀");
  },
  inviteToWarp(user = "Noa") {
    if (!this.warpOpen || this.warpConsumed) return;
    this.warpInvitedUser = user;
    this.emitReaction("👋");
  },
  consumeWarp() {
    if (!this.warpOpen || !this.warpInvitedUser || this.warpConsumed) return;
    this.warpConsumed = true;
    this.warpVisit += 1;
    this.emitReaction("∞");
  },
  async switchRuntimeProfile(id: string) {
    this.profileId = id;
    const preset = personaPreset(id);
    const moodMusic =
      moodMusicByProfile[id as keyof typeof moodMusicByProfile] ??
      moodMusicByProfile.camille;
    this.designMode = preset.designMode;
    this.userVisualStyle = preset.userVisualStyle;
    this.moodMusicTrack = moodMusic.track;
    this.moodMusicTitle = moodMusic.title;
    this.moodMusicStatus = "idle";
    this.moodMusicPlaying = false;
    this.playingVideoId = "";
    this.videoFloatObserver?.disconnect();
    if (this.videoScrollHandler) {
      window.removeEventListener("scroll", this.videoScrollHandler);
      this.videoScrollHandler = null;
    }
    this.videoFloating = false;
    this.discussionVideoId = "";
    this.feedArchive = [];
    this.runtimeMutations = [];
    this.widgetBranches = [];
    this.nextboundPreviews = [];
    this.focusedFrameId = "";
    this.runtimeTransitionStage = "idle";
    await this.initProceduralRuntime();
  },
  get currentCreatorVideos() {
    return (
      this.creatorVideos[this.profileId as keyof typeof this.creatorVideos] ??
      this.creatorVideos.maya
    );
  },
  get floatingCreatorVideo() {
    if (!this.playingVideoId || !this.videoFloating) return null;
    return (
      this.currentCreatorVideos.find(
        (video: (typeof creatorVideos)[keyof typeof creatorVideos][number]) =>
          video.id === this.playingVideoId,
      ) ?? null
    );
  },
  videoGridSpan(video: { orientation: string; score: number }) {
    if (video.orientation === "portrait") return 3;
    if (video.orientation === "square") return video.score >= 85 ? 5 : 4;
    return video.score >= 85 ? 6 : video.score >= 65 ? 4 : 3;
  },
  youtubeThumbnail(videoId: string) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  },
  fallbackYoutubeThumbnail(event: Event, videoId: string) {
    const image = event.currentTarget as HTMLImageElement | null;
    if (!image || image.dataset.fallback === "true") return;
    image.dataset.fallback = "true";
    image.src = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  },
  sourceHost(url: string) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "external source";
    }
  },
  articlePreviewStyle(article: {
    url: string;
    source?: string;
    community?: string;
    relevance: number;
  }) {
    const hue =
      Array.from(article.url).reduce((total, char) => total + char.charCodeAt(0), 0) %
      360;
    return `--preview-hue:${hue};--preview-score:${article.relevance}%`;
  },
  redditGridSpan(article: {
    title: string;
    summary: string;
    relevance: number;
  }) {
    const density = article.title.length + article.summary.length;
    if (density > 210 || article.relevance >= 96) return 5;
    if (density > 150 || article.relevance >= 88) return 4;
    return 3;
  },
  storyComponentGridSpan(component: { type: string; body?: string }) {
    if (component.type === "passage") return 4;
    return (component.body?.length ?? 0) > 58 ? 4 : 3;
  },
  toggleCreatorVideo(id: string) {
    this.playingVideoId = this.playingVideoId === id ? "" : id;
    this.videoFloating = false;
    this.$nextTick(() => this.watchPlayingVideoScroll());
  },
  stopFloatingVideo() {
    this.playingVideoId = "";
    this.videoFloating = false;
    this.videoFloatObserver?.disconnect();
    if (this.videoScrollHandler) {
      window.removeEventListener("scroll", this.videoScrollHandler);
      this.videoScrollHandler = null;
    }
  },
  closeFloatingVideo() {
    this.stopFloatingVideo();
    this.focusedContentId = "";
    this.discussionVideoId = "";
  },
  watchPlayingVideoScroll() {
    this.videoFloatObserver?.disconnect();
    if (this.videoScrollHandler) {
      window.removeEventListener("scroll", this.videoScrollHandler);
      this.videoScrollHandler = null;
    }
    this.videoFloating = false;
    if (!this.playingVideoId) return;
    const el = document.querySelector<HTMLElement>(
      `.feed-video[data-video-id="${this.playingVideoId}"]`,
    );
    if (!el) return;
    // We used to observe `el` itself with an IntersectionObserver, but once
    // the card goes `position: fixed` it's back inside the viewport by
    // definition — so the observer immediately fires "intersecting" again,
    // flips videoFloating back off, the card snaps back into the grid at its
    // (off-screen) natural spot, the observer fires "not intersecting" again,
    // and it flips back on. That feedback loop is the stutter/flicker.
    // Fix: measure the card's natural in-flow top ONCE, while we know it
    // isn't floating yet, and from then on just compare scrollY to that
    // fixed number — no re-measuring an element that we're the ones moving.
    const startScrollY = window.scrollY;
    const anchorTop = el.getBoundingClientRect().top + window.scrollY;

    const applyFloat = (goingFloating: boolean) => {
      if (goingFloating === this.videoFloating) return;
      const before = el.getBoundingClientRect();
      this.videoFloating = goingFloating;
      requestAnimationFrame(() => {
        const after = el.getBoundingClientRect();
        if (!after.width || !after.height) return;
        const dx =
          before.left + before.width / 2 - (after.left + after.width / 2);
        const dy =
          before.top + before.height / 2 - (after.top + after.height / 2);
        const scale = before.width / after.width;
        // Several design themes (wireframe included) reset every card with
        // `transform: none !important` so their static layout never drifts.
        // A plain inline style loses to that. setProperty(..., "important")
        // makes our inline value an author-important declaration too, and
        // inline beats stylesheet at equal importance, so the animation
        // actually plays instead of being silently canceled mid-flight.
        el.style.willChange = "transform";
        el.style.setProperty("transition", "none", "important");
        el.style.setProperty(
          "transform",
          `translate(${dx}px, ${dy}px) scale(${scale})`,
          "important",
        );
        el.getBoundingClientRect(); // flush, forces the start frame to paint
        requestAnimationFrame(() => {
          el.style.setProperty(
            "transition",
            "transform 340ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            "important",
          );
          el.style.setProperty(
            "transform",
            "translate(0, 0) scale(1)",
            "important",
          );
          const clear = () => {
            el.style.removeProperty("transition");
            el.style.removeProperty("transform");
            el.style.willChange = "";
            el.removeEventListener("transitionend", clear);
          };
          el.addEventListener("transitionend", clear);
        });
      });
    };

    let ticking = false;
    this.videoScrollHandler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        applyFloat(window.scrollY > startScrollY + 16 || window.scrollY > anchorTop - 24);
        ticking = false;
      });
    };
    window.addEventListener("scroll", this.videoScrollHandler, {
      passive: true,
    });
    this.videoScrollHandler();
  },
  discussCreatorVideo(id: string) {
    this.discussionVideoId = this.discussionVideoId === id ? "" : id;
    this.focusedContentId = this.discussionVideoId ? `video-${id}` : "";
    this.discussionDraft = "";
  },
  toggleAttention(id: string) {
    this.focusedContentId = this.focusedContentId === id ? "" : id;
  },
  nextStoryFrame() {
    this.storyIndex = (this.storyIndex + 1) % this.storyFrameComponents.length;
    this.focusedContentId = `story-${this.storyIndex}`;
    this.emitReaction("↗");
  },
  async enterContent(targetContractId: string) {
    const nextbound = this.runtimeExecution?.resolvedNextbounds?.find(
      (item: RuntimeNextbound) =>
        item.destination.targetId === targetContractId,
    );
    await this.runtimeInteract(
      nextbound?.id ?? `enter-${targetContractId}`,
      targetContractId,
    );
  },
  submitVideoDiscussion(id: string) {
    const prompt = this.discussionDraft.trim();
    if (!prompt) return;
    const existing = this.discussionReplies[id] ?? [];
    this.discussionReplies = {
      ...this.discussionReplies,
      [id]: [...existing, prompt],
    };
    this.discussionDraft = "";
    this.emitReaction("✦");
  },
  get userVisualStyleOptions() {
    const styles = {
      maya: [
        { value: "primary", label: "Signal grid" },
        { value: "secondary", label: "Terminal pulse" },
        { value: "ambient", label: "Data aurora" },
      ],
      camille: [
        { value: "primary", label: "Editorial paper" },
        { value: "secondary", label: "Ink bloom" },
        { value: "ambient", label: "Pastel atelier" },
      ],
      alex: [
        { value: "primary", label: "Civic structure" },
        { value: "secondary", label: "Boardroom ivory" },
        { value: "ambient", label: "Cobalt horizon" },
      ],
    } as const;
    return styles[this.profileId as keyof typeof styles] ?? styles.maya;
  },
  switchUserVisualStyle(style: string) {
    this.userVisualStyle = ["primary", "secondary", "ambient"].includes(style)
      ? style
      : "primary";
  },
  switchDesignMode(mode: string) {
    this.designMode = [
      "wireframe",
      "minimal",
      "glass",
      "brutalist",
      "playful",
      "swiss",
      "bauhaus",
      "editorial",
      "bento",
      "material",
      "neobrutalist",
      "clay",
      "neumorphic",
      "y2k",
      "cyberpunk",
      "retrofuturist",
    ].includes(mode)
      ? mode
      : "wireframe";
  },
  emitReaction(symbol: string) {
    const sequence = this.reactionSequence++;
    const profileOffset =
      this.profileId === "maya" ? 17 : this.profileId === "camille" ? 43 : 71;
    const reaction = {
      id: `reaction-${sequence}`,
      symbol,
      x: 12 + ((sequence * 29 + profileOffset) % 72),
      y: 72 + ((sequence * 13) % 18),
      dx: -90 + ((sequence * 47) % 180),
      dy: -260 - ((sequence * 31) % 190),
      hue: (sequence * 67 + profileOffset) % 360,
    };
    this.floatingReactions.push(reaction);
    setTimeout(() => {
      this.floatingReactions = this.floatingReactions.filter(
        (item: (typeof this.floatingReactions)[number]) =>
          item.id !== reaction.id,
      );
    }, 4200);
  },
  async generateMoodMusic() {
    if (this.moodMusicStatus === "generating") return;
    this.moodMusicStatus = "generating";
    this.moodMusicPlaying = false;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    this.moodMusicStatus = "ready";
    this.emitReaction("🎧");
    requestAnimationFrame(() => {
      const audio = document.querySelector<HTMLAudioElement>(
        "#mood-music-player",
      );
      if (!audio) return;
      audio.currentTime = 0;
      audio
        .play()
        .then(() => {
          this.moodMusicPlaying = true;
        })
        .catch(() => {
          this.moodMusicPlaying = false;
        });
    });
  },
  toggleMoodMusic() {
    const audio = document.querySelector<HTMLAudioElement>(
      "#mood-music-player",
    );
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => {
        this.moodMusicPlaying = true;
      });
    } else {
      audio.pause();
      this.moodMusicPlaying = false;
    }
  },
  hitGameTarget() {
    this.gameScore += 1;
    this.gameTarget = (this.gameTarget + 3 + this.gameScore) % 8;
    if (this.gameScore >= 3 && !this.lockCollected) {
      this.lockCollected = true;
      this.emitReaction("🔒");
      return;
    }
    this.emitReaction(this.gameScore % 3 === 0 ? "⚡" : "✦");
  },
  inviteParisPartner() {
    this.parisPartnerJoined = true;
    this.emitReaction("👥");
  },
  attachParisLock() {
    if (!this.lockCollected || !this.parisPartnerJoined) return;
    this.lockAttached = true;
    this.emitReaction("🔐");
  },
  revisitLockSeed(visitor: "Maya" | "Noa") {
    if (!this.lockAttached) return;
    this.lockSeedVisitor = visitor;
    this.lockSeedVisits += 1;
    this.emitReaction(visitor === "Maya" ? "⚡" : "🎨");
  },
  addPostIt() {
    const colors = ["yellow", "pink", "blue"];
    const prompts = [
      "Connect this to the next artifact",
      "Let another participant reshape it",
      "Turn this observation into motion",
    ];
    const index = this.postItSequence++;
    this.postIts.push({
      id: `note-${index}`,
      text: prompts[index % prompts.length],
      color: colors[index % colors.length],
      active: false,
    });
    this.emitReaction("🗒️");
  },
  activatePostIt(id: string) {
    const note = this.postIts.find(
      (item: (typeof this.postIts)[number]) => item.id === id,
    );
    if (!note) return;
    note.active = !note.active;
    this.emitReaction(note.active ? "📌" : "◌");
  },
  interactionLabel(
    direction: "left" | "right" | "up" | "down",
    kind: "widget" | "nextbound" = "widget",
  ) {
    const copy = {
      maya: {
        widget: {
          up: "Inspect ↑",
          left: "← Fork",
          right: "Compile →",
          down: "Trace ↓",
        },
        nextbound: {
          up: "Probe above",
          left: "Fork left",
          right: "Fork right",
          down: "Inspect below",
        },
      },
      camille: {
        widget: {
          up: "Lift ↑",
          left: "← Unfold",
          right: "Compose →",
          down: "Reveal ↓",
        },
        nextbound: {
          up: "Float above",
          left: "Unfold left",
          right: "Compose right",
          down: "Reveal below",
        },
      },
      alex: {
        widget: {
          up: "Elevate ↑",
          left: "← Reframe",
          right: "Advance →",
          down: "Decide ↓",
        },
        nextbound: {
          up: "Escalate",
          left: "Reframe left",
          right: "Advance right",
          down: "Review below",
        },
      },
    } as const;
    const profileCopy = copy[this.profileId as keyof typeof copy] ?? copy.maya;
    return profileCopy[kind][direction];
  },
  async runtimeInteract(nextboundId: string, targetContractId: string) {
    this.emitReaction("↗");
    const departingExecution = this.runtimeExecution
      ? {
          id: this.runtimeExecution.id,
          contractId: this.runtimeExecution.contractId,
          title:
            this.runtimeTrace?.contract?.title ??
            this.runtimeExecution.contractId,
          summary: this.runtimeExecution.generatedContent
            .map(
              (block: RuntimeExecution["generatedContent"][number]) =>
                block.text,
            )
            .join(" "),
          accent: this.runtimeExecution.resolvedPresentation.accent,
          visitNumber: this.runtimeExecution.visitNumber,
        }
      : null;
    const returnsToVisual = targetContractId === "visual-lab";
    let visualSource = this.runtimePreviousVisual;
    if (returnsToVisual && this.runtimeSession) {
      const reference = this.runtimeSession.executionHistory.find(
        (item: RuntimeSession["executionHistory"][number]) =>
          item.contractId === "visual-lab",
      );
      if (reference) {
        const result: any = await this.transport.call(
          "get_artifact_execution",
          { executionId: reference.executionId },
        );
        visualSource = result.execution;
      }
    }
    await this.run(async () => {
      const actionType = nextboundId.includes("claim")
        ? "opportunity_claimed"
        : nextboundId.includes("return")
          ? "navigation_returned"
          : "nextbound_opened";
      const result: any = await this.transport.call("process_interaction", {
        sessionId: this.runtimeSession!.id,
        actionType,
        nextboundId,
        targetId: targetContractId,
        metadata: {
          topic: targetContractId,
        },
      });
      this.runtimeSession = result.session;
      this.runtimeExecution = result.execution;
      this.runtimeMutations = result.mutations;
      this.runtimeTrace = await this.transport.call("get_session_trace", {
        sessionId: result.session.id,
      });
      if (
        departingExecution &&
        !this.feedArchive.some(
          (item: (typeof this.feedArchive)[number]) =>
            item.id === departingExecution.id,
        )
      )
        this.feedArchive.push(departingExecution);
      if (returnsToVisual) {
        this.runtimePreviousVisual = visualSource;
        this.runtimeTransitionStage = "holding";
        setTimeout(() => (this.runtimeTransitionStage = "morphing"), 450);
        setTimeout(() => (this.runtimeTransitionStage = "complete"), 1700);
        setTimeout(() => (this.runtimeTransitionStage = "idle"), 2450);
      }
    });
    this.observeRuntimeFrames();
    this.layoutWidgetBoard();
  },
  async runtimeInteractFromAction(
    action: RuntimeExecution["availableInteractions"][number],
  ) {
    const nextbound = this.runtimeExecution?.resolvedNextbounds.find(
      (item: RuntimeNextbound) =>
        item.destination.targetId === action.targetId ||
        item.presentation.label === action.label,
    );
    if (!nextbound || !action.targetId) return;
    await this.runtimeInteract(nextbound.id, action.targetId);
  },
  async mutateRuntimeWithoutNavigation(topic = "collaborative") {
    this.emitReaction("✦");
    await this.run(async () => {
      const result: any = await this.transport.call("process_interaction", {
        sessionId: this.runtimeSession!.id,
        actionType: "word_activated",
        targetId: topic,
        metadata: { topic },
      });
      this.runtimeSession = result.session;
      this.runtimeExecution = result.execution;
      this.runtimeMutations = result.mutations;
      this.runtimeTrace = await this.transport.call("get_session_trace", {
        sessionId: result.session.id,
      });
    });
    this.observeRuntimeFrames();
    this.layoutWidgetBoard();
  },
  async expandWidget(
    frameId: string,
    schemaId: string,
    direction: "left" | "right" | "up" | "down",
  ) {
    this.emitReaction(
      direction === "left"
        ? "←"
        : direction === "right"
          ? "→"
          : direction === "up"
            ? "↑"
            : "↓",
    );
    await this.run(async () => {
      const result: any = await this.transport.call("process_interaction", {
        sessionId: this.runtimeSession!.id,
        actionType: "action_clicked",
        frameId,
        metadata: { topic: schemaId, direction, mode: "expand_widget" },
      });
      this.runtimeSession = result.session;
      this.runtimeExecution = result.execution;
      this.runtimeMutations = result.mutations;
      this.runtimeTrace = await this.transport.call("get_session_trace", {
        sessionId: result.session.id,
      });
      const id = `branch-${schemaId}-${direction}`;
      if (
        !this.widgetBranches.some(
          (branch: (typeof this.widgetBranches)[number]) => branch.id === id,
        )
      )
        this.widgetBranches.push({
          id,
          parentSchemaId: schemaId,
          direction,
          title: `${this.interactionLabel(direction)} · ${schemaId}`,
          content:
            this.profileId === "maya"
              ? `A testable ${direction} branch exposes the ${schemaId} logic and can feed the next resolution.`
              : this.profileId === "camille"
                ? `An editorial fragment unfolds ${direction}, extending the visual language of ${schemaId}.`
                : `A structured ${direction} decision frame reframes ${schemaId} without losing its source.`,
        });
    });
    this.observeRuntimeFrames();
    this.layoutWidgetBoard();
  },
  async previewNextbound(
    nextboundId: string,
    targetContractId: string,
    direction: "left" | "right" | "up" | "down" = "down",
  ) {
    this.emitReaction("◌");
    await this.run(async () => {
      const result: any = await this.transport.call("process_interaction", {
        sessionId: this.runtimeSession!.id,
        actionType: "action_clicked",
        metadata: {
          topic: targetContractId,
          direction,
          mode: "preview_nextbound",
        },
      });
      this.runtimeSession = result.session;
      this.runtimeExecution = result.execution;
      this.runtimeMutations = result.mutations;
      const id = `preview-${nextboundId}-${direction}`;
      if (
        !this.nextboundPreviews.some(
          (preview: (typeof this.nextboundPreviews)[number]) =>
            preview.id === id,
        )
      )
        this.nextboundPreviews.push({
          id,
          nextboundId,
          targetContractId,
          direction,
          title: `Preview · ${targetContractId}`,
        });
    });
    this.layoutWidgetBoard();
  },
  layoutWidgetBoard() {
    requestAnimationFrame(() => {
      const board = document.querySelector<HTMLElement>(".runtime-demo");
      if (!board) return;
      const widgets = Array.from(
        board.querySelectorAll<HTMLElement>(
          ".news-feed [data-widget], .news-feed .adaptive-piece, .news-feed .runtime-frame, .news-feed .nextbound-widget, .news-feed .nextbound-preview-widget, .news-feed .inline-mutation, .news-feed .video-library > header, .news-feed .reddit-field > header, [data-widget]",
        ),
      );
      if (board.closest(".news-feed")) {
        const placeMasonry = () => {
          const visibleWidgets = widgets
            .filter((widget) => {
              const styles = getComputedStyle(widget);
              return (
                styles.display !== "none" &&
                styles.display !== "contents" &&
                styles.visibility !== "hidden"
              );
            })
            .sort((left, right) => {
              const leftOrder = Number.parseInt(getComputedStyle(left).order, 10);
              const rightOrder = Number.parseInt(
                getComputedStyle(right).order,
                10,
              );
              return (
                (Number.isFinite(leftOrder) ? leftOrder : 0) -
                (Number.isFinite(rightOrder) ? rightOrder : 0)
              );
            });
          const styles = getComputedStyle(board);
          const gap = Number.parseFloat(styles.columnGap) || 12;
          const width = board.clientWidth;
          const columns = width >= 980 ? 3 : width >= 640 ? 2 : 1;
          const columnWidth = (width - gap * (columns - 1)) / columns;
          const columnHeights = Array.from({ length: columns }, () => 0);

          for (const widget of visibleWidgets) {
            const widgetKind = widget.dataset.widget;
            const targetColumn =
              columns >= 3 && (widgetKind === "team-game" || widgetKind === "game")
                ? 1
                : columnHeights.indexOf(Math.min(...columnHeights));
            widget.style.position = "absolute";
            widget.style.width = `${columnWidth}px`;
            widget.style.left =
              columns >= 3 && (widgetKind === "team-game" || widgetKind === "game")
                ? `${(width - columnWidth) / 2 - columnWidth * 0.82}px`
                : `${targetColumn * (columnWidth + gap)}px`;
            widget.style.top = `${columnHeights[targetColumn]}px`;
            widget.style.gridColumn = "auto";
            widget.style.gridRowEnd = "auto";
            const height = Math.max(
              widget.scrollHeight,
              widget.getBoundingClientRect().height,
            );
            columnHeights[targetColumn] += height + gap;
          }
          board.style.height = `${Math.max(...columnHeights) - gap}px`;
        };
        this.widgetResizeObserver?.disconnect();
        this.widgetResizeObserver = new ResizeObserver(() => placeMasonry());
        for (const widget of widgets) this.widgetResizeObserver.observe(widget);
        this.widgetResizeObserver.observe(board);
        placeMasonry();
        window.setTimeout(placeMasonry, 250);
        window.setTimeout(placeMasonry, 900);
        return;
      }
      const place = (widget: HTMLElement) => {
        if (getComputedStyle(widget).display === "contents") return;
        const styles = getComputedStyle(board);
        const rowHeight = Number.parseFloat(styles.gridAutoRows) || 10;
        const gap = Number.parseFloat(styles.rowGap) || 18;
        const height = Math.max(
          widget.scrollHeight,
          widget.getBoundingClientRect().height,
        );
        widget.style.gridRowEnd = `span ${Math.max(1, Math.ceil((height + gap) / (rowHeight + gap)))}`;
      };
      this.widgetResizeObserver?.disconnect();
      this.widgetResizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) place(entry.target as HTMLElement);
      });
      for (const widget of widgets) {
        place(widget);
        this.widgetResizeObserver.observe(widget);
      }
    });
  },
  observeRuntimeFrames() {
    requestAnimationFrame(() => {
      this.frameObserver?.disconnect();
      this.frameObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible)
            this.focusedFrameId =
              (visible.target as HTMLElement).dataset.frameId ?? "";
        },
        { threshold: [0.35, 0.7] },
      );
      document
        .querySelectorAll("[data-runtime-frame]")
        .forEach((frame) => this.frameObserver?.observe(frame));
    });
  },
  get runtimeDebugView() {
    const previous = this.runtimePreviousVisual;
    const current = this.runtimeExecution;
    const removedAnchors = previous?.activatedAnchors.filter(
      (old: RuntimeExecution["activatedAnchors"][number]) =>
        !current?.activatedAnchors.some(
          (next: RuntimeExecution["activatedAnchors"][number]) =>
            next.phrase === old.phrase,
        ),
    );
    const addedAnchors = current?.activatedAnchors.filter(
      (next: RuntimeExecution["activatedAnchors"][number]) =>
        !previous?.activatedAnchors.some(
          (old: RuntimeExecution["activatedAnchors"][number]) =>
            old.phrase === next.phrase,
        ),
    );
    const removedNextbounds = previous?.resolvedNextbounds.filter(
      (old: RuntimeNextbound) =>
        !current?.resolvedNextbounds.some(
          (next: RuntimeNextbound) => next.id === old.id,
        ),
    );
    const addedNextbounds = current?.resolvedNextbounds.filter(
      (next: RuntimeNextbound) =>
        !previous?.resolvedNextbounds.some(
          (old: RuntimeNextbound) => old.id === next.id,
        ),
    );
    return {
      stableContract: {
        contractId: current?.contractId,
        contractVersion: current?.contractVersion,
        creatorIntent: this.runtimeTrace?.contract?.invariants?.creatorIntent,
        preservedInvariants: current?.complianceTrace.preservedInvariantIds,
      },
      changedExecution: {
        previousExecutionId: previous?.id,
        newExecutionId: current?.id,
        visitNumber: current?.visitNumber,
        previousPathFingerprint: previous?.pathFingerprint,
        currentPathFingerprint: current?.pathFingerprint,
      },
      context: {
        okfContribution: current ? "40%" : undefined,
        liveSessionContribution: current ? "60%" : undefined,
        recentOrderedInteractions:
          this.runtimeSession?.interactionLog.slice(-6),
        semanticScratchpad: this.runtimeSession?.semanticScratchpad.slice(-6),
      },
      transformation: {
        removedAnchors,
        addedAnchors,
        removedNextbounds,
        addedNextbounds,
        mutations: this.runtimeMutations,
        reasons: addedNextbounds?.map(
          (item: RuntimeNextbound) => item.explainability.reason,
        ),
      },
      focusedFrameId: this.focusedFrameId,
    };
  },
  get adaptiveBackdrop() {
    const presentation = this.runtimeExecution?.resolvedPresentation;
    const contractId = this.runtimeExecution?.contractId ?? "visual-lab";
    const contractPalette: Record<string, [string, string, string, string]> = {
      "visual-lab": ["#5275ff", "#8f7cff", "#08111f", "118deg"],
      "technical-prototype": ["#38d9ff", "#345dff", "#061421", "92deg"],
      "multiplayer-snake": ["#72f0c2", "#ffb84d", "#071b18", "146deg"],
      "collaborative-artifact": ["#f3a7c8", "#3157c8", "#160d1d", "205deg"],
      "living-canvas": ["#f3a7c8", "#f0c987", "#1b1119", "228deg"],
      "constraint-room": ["#3157c8", "#f4efe2", "#0c1020", "64deg"],
    };
    const palette =
      contractPalette[contractId] ?? contractPalette["visual-lab"];
    const profilePalette: Record<
      string,
      {
        accent: string;
        secondary: string;
        base: string;
        font: string;
        display: string;
        radius: string;
      }
    > = {
      maya: {
        accent: "#38d9ff",
        secondary: "#9dff57",
        base: "#061421",
        font: '"DM Mono", monospace',
        display: "Inter, Arial, sans-serif",
        radius: "8px",
      },
      camille: {
        accent: "#ff79b8",
        secondary: "#ffc857",
        base: "#21131d",
        font: '"Playfair Display", Georgia, serif',
        display: '"Playfair Display", Georgia, serif',
        radius: "34px",
      },
      alex: {
        accent: "#3157c8",
        secondary: "#f4efe2",
        base: "#0b1020",
        font: "Inter, Arial, sans-serif",
        display: "Inter, Arial, sans-serif",
        radius: "2px",
      },
    };
    const signature = profilePalette[this.profileId] ?? profilePalette.maya;
    const accent = signature.accent;
    const base = signature.base;
    return [
      `--live-accent:${accent}`,
      `--contract-accent:${presentation?.accent ?? palette[0]}`,
      `--live-secondary:${signature.secondary}`,
      `--live-base:${base}`,
      `--live-angle:${palette[3]}`,
      `--profile-font:${signature.font}`,
      `--profile-display:${signature.display}`,
      `--profile-radius:${signature.radius}`,
      `--live-density:${presentation?.density === "compact" ? "26px" : presentation?.density === "immersive" ? "58px" : "42px"}`,
    ].join(";");
  },
  profile(id: string) {
    return profiles.find((p) => p.id === id)!;
  },
  get currentActions() {
    return this.session?.nodes.at(-1)?.actions || [];
  },
  get currentExecution() {
    return this.session?.nodes.at(-1)?.execution || null;
  },
  get debugView() {
    if (this.loopMode) return this.runtimeDebugView;
    const current = this.currentExecution;
    const previous = this.lastTransition?.from;
    return {
      contractId: current?.contractId,
      contractVersion: current?.contractVersion,
      executionIdBefore: previous?.executionId,
      executionIdAfter: current?.executionId,
      visitNumber: current?.visitNumber,
      pathFingerprintBefore: previous?.pathFingerprint,
      pathFingerprintAfter: current?.pathFingerprint,
      okfContribution: current ? "40%" : undefined,
      sessionContribution: current ? "60%" : undefined,
      semanticScratchpad: current?.scratchpadObservations,
      nextboundExplanation: current?.nextboundExplanation,
      orderedEventLog: this.session?.eventLog,
    };
  },
  async selectProfile(id: string) {
    await this.run(async () => {
      this.profileId = id;
      const resolved: any = await this.transport.call("resolve_okf_context", {
        intentId: "afterlight",
        profileId: id,
      });
      this.context = {
        profileId: resolved.profileId,
        ...(resolved.normalizedContext as any),
        explanation: [resolved.contextExplanation],
      };
      const compiled: any = await this.transport.call("compile_experience", {
        intentId: "afterlight",
        profileId: id,
      });
      this.experience = compiled.experience;
      this.session = compiled.session;
      this.transition = null;
      this.lastTransition = null;
    });
    requestAnimationFrame(() =>
      document
        .querySelector(".experience")
        ?.scrollTo({ top: 0, behavior: "smooth" }),
    );
  },
  async act(actionId: string) {
    await this.run(async () => {
      const result: any = await this.transport.call("resolve_next_action", {
        sessionId: this.session!.id,
        actionId,
      });
      this.session = result.session;
      if (result.executionTransition) {
        this.transition = result.executionTransition;
        this.lastTransition = result.executionTransition;
        this.transitionStage = "holding";
        setTimeout(() => (this.transitionStage = "morphing"), 350);
        setTimeout(() => (this.transitionStage = "complete"), 1450);
        setTimeout(() => {
          this.transition = null;
          this.transitionStage = "idle";
        }, 2100);
      }
    });
    requestAnimationFrame(() =>
      document
        .querySelector(".node:last-child")
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  },
  async pause() {
    const tool =
      this.session?.status === "paused"
        ? "resume_experience"
        : "pause_experience";
    await this.run(async () => {
      this.session = (
        await this.transport.call(tool, {
          sessionId: this.session!.id,
        })
      ).session;
    });
  },
  async stop() {
    await this.run(async () => {
      this.session = (
        await this.transport.call("stop_experience", {
          sessionId: this.session!.id,
        })
      ).session;
    });
  },
  async restart() {
    await this.run(async () => {
      this.session = (
        await this.transport.call("restart_experience", {
          sessionId: this.session!.id,
        })
      ).session;
      this.transition = null;
      this.lastTransition = null;
    });
  },
  async shareExperience() {
    await this.run(async () => {
      this.share = await this.transport.call("share_experience", {
        sessionId: this.session!.id,
      });
    });
  },
  async run(fn: () => Promise<void>) {
    this.loading = true;
    this.error = "";
    try {
      await fn();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "The request failed.";
    } finally {
      this.loading = false;
    }
  },
  inviteTeamGamePlayer() {
    const name = this.teamGameInviteName.trim();
    if (!name) return;
    this.teamGamePlayers.push(name);
    this.teamGameInviteName = "";
  },
  initials(s: string) {
    return s
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2);
  },
}));
(window as any).Alpine = Alpine;
Alpine.start();
initTeamGames();
