import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Heart,
  ExternalLink,
  LoaderCircle,
  Music2,
  Search,
  Send,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { installLocalPreview } from "./local-preview.js";
import { ArtifactPanel, useExperienceArtifact } from "./experience-artifact.js";
import { TeamGame } from "./team-game.js";
import "./styles.css";

type PersonaId = "alex" | "camille" | "maya";
type View = "search" | "creator" | "intent" | "experience" | "share";
const personaMusic: Record<
  PersonaId,
  { title: string; note: string; playlistId: string }
> = {
  alex: {
    title: "Deep Focus",
    note: "Ambient focus for a clear, productive day.",
    playlistId: "37i9dQZF1DWZeKCadgRdKQ",
  },
  camille: {
    title: "Jazz Vibes",
    note: "Cozy, low-noise jazz for a curated night in.",
    playlistId: "37i9dQZF1DX0SM0LYsmbMT",
  },
  maya: {
    title: "Creative Focus",
    note: "Instrumental space for ideas, making, and flow.",
    playlistId: "37i9dQZF1DWWn6teJIIcfG",
  },
};
const generatedMoodTracks: Record<PersonaId, { title: string; src: string }> = {
  alex: {
    title: "Alex - Techno",
    src: "/music/alex-techno.mp3",
  },
  camille: {
    title: "Velvet and Neon",
    src: "/music/velvet-and-neon-camille.m4a",
  },
  maya: {
    title: "Maya 15s",
    src: "/music/maya-15s.mp3",
  },
};
const fallbackPersonas = [
  { id: "alex", name: "Alex", label: "Developer Student" },
  { id: "camille", name: "Camille", label: "Curated Chaos Artistic Director" },
  { id: "maya", name: "Maya", label: "Independent Creator" },
];
const isLocalPreview = installLocalPreview();
const call = async (name: string, args: Record<string, unknown>) =>
  (await window.openai?.callTool?.(name, args))?.structuredContent ?? {};
const output = () =>
  (window.openai?.toolOutput ?? window.openai?.widgetState?.data ?? {}) as any;

function App() {
  const initial = output();
  const [data, setData] = useState<any>(initial);
  const [view, setView] = useState<View>(
    initial.results
      ? "search"
      : initial.publicIntents
        ? "creator"
        : initial.intent && initial.availablePersonas
          ? "intent"
          : initial.experience
            ? "experience"
            : initial.shareId
              ? "share"
              : "search",
  );
  const [personaId, setPersonaId] = useState<PersonaId>(
    (initial.experience?.personaId as PersonaId) ?? "alex",
  );
  const [liked, setLiked] = useState(Boolean(initial.liked));
  const [following, setFollowing] = useState(Boolean(initial.following));
  const [saved, setSaved] = useState(Boolean(initial.experience?.saved));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastExperience, setLastExperience] = useState<any>(
    initial.experience ? initial : null,
  );
  const intent = data.intent;
  const experience = data.experience;
  const personas = data.availablePersonas ?? fallbackPersonas;

  // Lifted above <Experience>: every like/follow/save/share action flips
  // `loading` true→false, which unmounts and remounts <Experience> (it only
  // renders while `!loading`). If the artifact's traits lived inside
  // Experience, that remount would wipe them back to a fresh seed on every
  // single interaction. Keeping the hook here means the artifact survives
  // the loading flicker.
  const {
    traits: artifactTraits,
    complete: artifactComplete,
    signal: signalArtifact,
    markComplete: completeArtifact,
  } = useExperienceArtifact(personaId, experience?.id);

  useEffect(() => {
    window.openai?.setWidgetState?.({
      view,
      personaId,
      liked,
      following,
      saved,
      data,
    });
  }, [view, personaId, liked, following, saved, data]);

  const run = async (
    tool: string,
    args: Record<string, unknown>,
    next?: View,
  ) => {
    setLoading(true);
    setError("");
    const response = await call(tool, args);
    setLoading(false);
    if ((response as any).error) {
      setError(
        (response as any).error.message ||
          "The preview could not complete that action.",
      );
      return null;
    }
    setData(response);
    if ((response as any).experience) setLastExperience(response);
    if (next) setView(next);
    return response as any;
  };

  const mutate = async (tool: string, args: Record<string, unknown>) => {
    setLoading(true);
    setError("");
    const response = await call(tool, args);
    setLoading(false);
    if ((response as any).error) {
      setError(
        (response as any).error.message ||
          "The preview could not complete that action.",
      );
      return null;
    }
    return response as any;
  };

  const currentCreatorId = intent?.creatorId ?? data.creator?.id;
  const demoRoute = async (route: string) => {
    if (route === "loading") {
      setError("");
      setLoading(true);
      return;
    }
    setLoading(false);
    if (route === "error") {
      setError(
        "This is a friendly demo error. Try another state or return to discovery.",
      );
      return;
    }
    setError("");
    if (route === "empty")
      return void run(
        "search_public_intents",
        { query: "no-results-zzzz" },
        "search",
      );
    if (route === "discovery")
      return void run("search_public_intents", { query: "" }, "search");
    const [kind, creator, persona] = route.split(":");
    const creatorId = `creator_${creator}`;
    const intentId =
      creator === "noah"
        ? "intent_noah_build_week"
        : creator === "amelie"
          ? "intent_amelie_beauty_ritual"
          : "intent_luna_main_character";
    if (kind === "profile")
      return void run("get_creator_profile", { creatorId }, "creator");
    setPersonaId(persona as PersonaId);
    return void run(
      "generate_experience",
      { intentId, personaId: persona },
      "experience",
    );
  };

  return (
    <main className="shell">
      <header className="appbar">
        <button
          className="brand"
          onClick={() =>
            void run("search_public_intents", { query: "" }, "search")
          }
        >
          <span className="brand-mark">A</span>Adaptive Media
        </button>
        <span className="demo-label">
          {isLocalPreview ? "Demo · local preview" : "Adaptive experience"}
        </span>
      </header>
      {isLocalPreview && <DemoControls onChange={demoRoute} />}
      {error && (
        <StatusState
          kind="error"
          message={error}
          onReset={() =>
            void run("search_public_intents", { query: "" }, "search")
          }
        />
      )}
      {!error && loading && <StatusState kind="loading" />}
      {!error && !loading && view === "search" && (
        <Discovery
          data={data}
          search={(query: string) =>
            run("search_public_intents", { query }, "search")
          }
          openProfile={(id: string) =>
            run("get_creator_profile", { creatorId: id }, "creator")
          }
          openIntent={(id: string) =>
            run("get_intent", { intentId: id }, "intent")
          }
        />
      )}
      {!error && !loading && view === "creator" && (
        <section className="view">
          <button
            className="back"
            onClick={() =>
              void run("search_public_intents", { query: "" }, "search")
            }
          >
            <ArrowLeft size={16} />
            Discovery
          </button>
          <div className="profile-head">
            <div>
              <h1>{data.creator?.name}</h1>
              <p>
                {data.creator?.handle} · {data.creator?.category}
              </p>
              <p className="bio">{data.creator?.bio}</p>
              {data.creator?.fictional && (
                <em className="fictional-notice">
                  Fictional creator. No association with a real celebrity.
                </em>
              )}
            </div>
            <button
              className="secondary"
              onClick={async () => {
                const next = !following;
                const r: any = await mutate("follow_creator", {
                  creatorId: data.creator.id,
                  following: next,
                });
                if (r) setFollowing(r.following);
              }}
            >
              {following ? <Check size={16} /> : <UserPlus size={16} />}{" "}
              {following ? "Following · Demo" : "Follow · Demo"}
            </button>
          </div>
          {data.publicIntents?.map((item: any) => (
            <div className="intent-feature" key={item.id}>
              <div>
                <span className="eyebrow">Public published Intent</span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
              <button
                className="primary"
                onClick={() =>
                  void run("get_intent", { intentId: item.id }, "intent")
                }
              >
                View Intent <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </section>
      )}
      {!error && !loading && view === "intent" && (
        <section className="view">
          <button
            className="back"
            onClick={() =>
              currentCreatorId &&
              void run(
                "get_creator_profile",
                { creatorId: currentCreatorId },
                "creator",
              )
            }
          >
            <ArrowLeft size={16} />
            Creator profile
          </button>
          <span className="eyebrow">
            Original creator Intent · {intent?.publicationStatus}
          </span>
          <h1>{intent?.title}</h1>
          <p className="lede">{intent?.description}</p>
          <blockquote>
            <span>Creator’s immutable message</span>
            <p>“{intent?.immutableMessage?.coreIdea}”</p>
            <footer>
              {data.creator?.name} · {data.creator?.handle}
            </footer>
          </blockquote>
          <div className="itinerary">
            {intent?.immutableMessage?.requiredClaims?.map((claim: string) => (
              <article className="stop" key={claim}>
                <div>
                  <h3>{claim}</h3>
                </div>
              </article>
            ))}
          </div>
          <p className="commercial">
            <b>Commercial disclosure:</b> {intent?.monetization?.disclosure}
          </p>
          <div className="persona-selector">
            <label htmlFor="persona">Experience as</label>
            <select
              id="persona"
              value={personaId}
              onChange={(event) =>
                setPersonaId(event.target.value as PersonaId)
              }
            >
              {personas.map((persona: any) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name} — {persona.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className="primary full"
            onClick={() =>
              void run(
                "generate_experience",
                { intentId: intent.id, personaId },
                "experience",
              )
            }
          >
            <Sparkles size={16} />
            Experience it
          </button>
        </section>
      )}
      {!error && !loading && view === "experience" && (
        <Experience
          data={data}
          personaId={personaId}
          artifactTraits={artifactTraits}
          artifactComplete={artifactComplete}
          signalArtifact={signalArtifact}
          completeArtifact={completeArtifact}
          setPersonaId={async (id: PersonaId) => {
            setPersonaId(id);
            await run(
              "generate_experience",
              { intentId: experience.intentId, personaId: id },
              "experience",
            );
          }}
          liked={liked}
          following={following}
          saved={saved}
          onBack={() =>
            void run("get_intent", { intentId: experience.intentId }, "intent")
          }
          onLike={async () => {
            const r: any = await mutate("like_intent", {
              intentId: experience.intentId,
              liked: !liked,
            });
            if (r) setLiked(r.liked);
          }}
          onFollow={async () => {
            const id = experience.intentId.includes("noah")
              ? "creator_noah"
              : experience.intentId.includes("amelie")
                ? "creator_amelie"
                : "creator_luna";
            const r: any = await mutate("follow_creator", {
              creatorId: id,
              following: !following,
            });
            if (r) setFollowing(r.following);
          }}
          onSave={async () => {
            const r: any = await mutate("save_experience", {
              experienceId: experience.id,
              saved: !saved,
            });
            if (r) setSaved(r.saved);
          }}
          onShare={async () => {
            setLastExperience(data);
            await run(
              "create_share_link",
              { experienceId: experience.id },
              "share",
            );
          }}
        />
      )}
      {!error && !loading && view === "share" && (
        <section className="view invitation-view">
          <button
            className="back"
            onClick={() => {
              if (lastExperience) setData(lastExperience);
              setView("experience");
            }}
          >
            <ArrowLeft size={16} />
            Experience
          </button>
          <span className="eyebrow">
            Demo share reference · not publicly hosted
          </span>
          <h1>{data.artifact?.title}</h1>
          <p className="lede">{data.artifact?.preview}</p>
          <blockquote>
            <footer>
              {data.creator?.name} · {data.creator?.handle}
            </footer>
          </blockquote>
          <p>
            Original Intent: <b>{data.intent?.title}</b>
          </p>
          <p className="privacy">
            This preview contains public creator attribution and artifact
            content only. Persona data is not included.
          </p>
          <button
            className="primary full"
            onClick={() => navigator.clipboard?.writeText(data.shareId)}
          >
            <Send size={16} />
            Copy demo reference
          </button>
        </section>
      )}
    </main>
  );
}

function DemoControls({ onChange }: { onChange: (value: string) => void }) {
  return (
    <div className="demo-controls">
      <label htmlFor="demo-state">Demo state</label>
      <select
        id="demo-state"
        defaultValue="discovery"
        onChange={(event) => void onChange(event.target.value)}
      >
        <option value="discovery">Discovery</option>
        <option value="profile:noah">Noah profile</option>
        <option value="profile:amelie">Amélie profile</option>
        <option value="profile:luna">Luna profile</option>
        {["noah", "amelie", "luna"].flatMap((creator) =>
          ["alex", "camille", "maya"].map((persona) => (
            <option
              key={`${creator}:${persona}`}
              value={`experience:${creator}:${persona}`}
            >
              {creator[0].toUpperCase() + creator.slice(1)} ×{" "}
              {persona[0].toUpperCase() + persona.slice(1)}
            </option>
          )),
        )}
        <option value="loading">Loading state</option>
        <option value="empty">Empty state</option>
        <option value="error">Error state</option>
      </select>
    </div>
  );
}

function StatusState({
  kind,
  message,
  onReset,
}: {
  kind: "loading" | "error";
  message?: string;
  onReset?: () => void;
}) {
  return (
    <section
      className="view status-state"
      role={kind === "error" ? "alert" : "status"}
    >
      {kind === "loading" ? (
        <>
          <div className="loader" />
          <h1>Preparing your experience</h1>
          <p className="lede">Loading the deterministic local preview…</p>
        </>
      ) : (
        <>
          <span className="eyebrow">Preview error</span>
          <h1>That state could not be opened</h1>
          <p className="lede">{message}</p>
          <button className="primary" onClick={onReset}>
            Return to discovery
          </button>
        </>
      )}
    </section>
  );
}

function Discovery({ data, search, openProfile, openIntent }: any) {
  const results = data.results ?? [];
  const [query, setQuery] = useState(data.query ?? "");
  return (
    <section className="view">
      <span className="eyebrow">{results.length} public creator Intents</span>
      <h1>Choose a voice. See your version.</h1>
      <form
        className="searchbar"
        onSubmit={(event) => {
          event.preventDefault();
          void search(query);
        }}
      >
        <Search size={18} />
        <input
          aria-label="Search public creator Intents"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search creators and Intents"
        />
        <button className="primary" type="submit">
          Search
        </button>
      </form>
      {data.query && <p className="lede">Results for “{data.query}”</p>}
      {results.length === 0 ? (
        <div className="empty-state">
          <h2>No public Intents found</h2>
          <p>Try a creator, topic, or desired outcome.</p>
        </div>
      ) : (
        <div className="result-list">
          {results.map((result: any, index: number) => (
            <article className="result" key={result.intent.id}>
              <div className="result-index">0{index + 1}</div>
              <div className="result-body">
                <button
                  className="creator-link"
                  onClick={() => openProfile(result.creator.id)}
                >
                  <span className="avatar">{result.creator.name[0]}</span>
                  <span>
                    <b>
                      {result.creator.name}
                      {result.creator.id === "creator_luna"
                        ? " · fictional"
                        : ""}
                    </b>
                    <small>
                      {result.creator.handle} · {result.creator.category}
                    </small>
                  </span>
                </button>
                <h2>{result.intent.title}</h2>
                <p>{result.intent.description}</p>
                <p className="match">
                  <Sparkles size={14} />
                  {result.matchReason} · score {result.matchScore}
                </p>
                <div className="result-footer">
                  <span className="commercial">{result.monetizationLabel}</span>
                  <button
                    className="primary small"
                    onClick={() => openIntent(result.intent.id)}
                  >
                    View Intent <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Experience({
  data,
  personaId,
  setPersonaId,
  onBack,
  liked,
  following,
  saved,
  onLike,
  onFollow,
  onSave,
  onShare,
  artifactTraits,
  artifactComplete,
  signalArtifact,
  completeArtifact,
}: any) {
  const experience = data.experience;
  const steps = experience.structuredOutcome?.steps ?? [];
  const [musicGenerating, setMusicGenerating] = useState(false);
  const [moodTrackReady, setMoodTrackReady] = useState(false);
  const music = personaMusic[personaId as PersonaId] ?? personaMusic.alex;
  const generatedMoodTrack =
    generatedMoodTracks[personaId as PersonaId] ?? generatedMoodTracks.alex;

  const generateMoodTrack = () => {
    setMusicGenerating(true);
    signalArtifact({ github: true });
    window.setTimeout(() => {
      setMusicGenerating(false);
      setMoodTrackReady(true);
    }, 900);
  };

  // Each of these mirrors a real interaction into the artifact's journey
  // signals — only on the transition into the active state, never on undo,
  // matching the "interactions are never retroactively un-lived" rule.
  const handleLike = async () => {
    if (!liked) signalArtifact({ youtube: true });
    await onLike();
  };
  const handleFollow = async () => {
    if (!following) signalArtifact({ collaboration: true });
    await onFollow();
  };
  const handleSave = async () => {
    if (!saved) signalArtifact({ savedInsight: true });
    await onSave();
  };
  const handleShare = async () => {
    signalArtifact({ collaboration: true });
    completeArtifact();
    await onShare();
  };
  return (
    <section className="view experience-view">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={16} />
        Original Intent
      </button>
      <div className="persona-selector">
        <label>View as</label>
        <select
          value={personaId}
          onChange={(event) => setPersonaId(event.target.value)}
        >
          {data.availablePersonas.map((persona: any) => (
            <option key={persona.id} value={persona.id}>
              {persona.name} — {persona.label}
            </option>
          ))}
        </select>
        <small>Deterministic Demo selector. No live model.</small>
      </div>
      <div className="origin">
        Created from <b>{experience.creatorAttribution}</b>
      </div>
      <span className="eyebrow">{experience.originalIntentTitle}</span>
      <h1>{experience.personalizedTitle}</h1>
      <p className="lede">{experience.structuredOutcome?.summary}</p>
      <div className="personalized-note">
        <Sparkles size={16} />
        {experience.matchExplanation}
      </div>
      <ArtifactPanel
        traits={artifactTraits}
        complete={artifactComplete}
        onSignal={signalArtifact}
      />
      <section className="music-section" aria-labelledby="music-title">
        <div className="music-heading">
          <div>
            <span className="section-label">Your sound today</span>
            <h2 id="music-title">
              Music for {personaId[0].toUpperCase() + personaId.slice(1)}
            </h2>
            <p>{music.note}</p>
          </div>
          <Music2 size={22} aria-hidden="true" />
        </div>
        <iframe
          key={music.playlistId}
          className="spotify-player"
          src={`https://open.spotify.com/embed/playlist/${music.playlistId}?utm_source=generator&theme=0`}
          title={`${music.title} on Spotify`}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
        <a
          className="spotify-link"
          href={`https://open.spotify.com/playlist/${music.playlistId}`}
          target="_blank"
          rel="noreferrer"
        >
          Open {music.title} in Spotify <ExternalLink size={13} />
        </a>
        <div className="suno-card">
          <div>
            <span className="suno-badge">Suno</span>
            <h3>Make music from my mood today</h3>
            <p>Turn this personalized moment into a one-of-one soundtrack.</p>
          </div>
          <button
            className="mood-generate"
            onClick={generateMoodTrack}
            disabled={musicGenerating}
          >
            {musicGenerating ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Sparkles size={17} />
            )}
            {musicGenerating
              ? "Composing your day…"
              : moodTrackReady
                ? "Generate another version"
                : "Generate my mood-day music"}
          </button>
          {moodTrackReady && (
            <div className="generated-track" aria-live="polite">
              <div>
                <span>Today’s generated track</span>
                <b>{generatedMoodTrack.title}</b>
              </div>
              <audio
                controls
                preload="metadata"
                src={generatedMoodTrack.src}
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          )}
        </div>
      </section>
      <TeamGame personaId={personaId} />
      <div className="itinerary">
        <div className="section-label">
          <span>Preserved methodology</span>
          <span>{steps.length} parts</span>
        </div>
        {steps.map((step: any, index: number) => (
          <article className="stop" key={step.title}>
            <div className="timeline">
              <i>{index + 1}</i>
            </div>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </article>
        ))}
      </div>
      <blockquote>
        <span>Creator’s message · preserved</span>
        <p>“{experience.preservedCreatorMessage.coreIdea}”</p>
        <footer>{experience.creatorAttribution}</footer>
      </blockquote>
      <p className="commercial">
        <b>Commercial disclosure:</b> {experience.commercialDisclosure?.label}
      </p>
      <p className="next-action">
        <b>Suggested next action:</b> {experience.suggestedNextAction}
      </p>
      <div className="actionbar">
        <button
          className={`action ${liked ? "selected" : ""}`}
          onClick={handleLike}
        >
          <Heart size={18} />
          {liked ? "Liked · Demo" : "Like · Demo"}
        </button>
        <button
          className={`action ${following ? "selected" : ""}`}
          onClick={handleFollow}
        >
          <UserPlus size={18} />
          {following ? "Following · Demo" : "Follow · Demo"}
        </button>
        <button
          className={`action ${saved ? "selected" : ""}`}
          onClick={handleSave}
        >
          <Bookmark size={18} />
          {saved ? "Saved · Demo" : "Save · Demo"}
        </button>
        <button className="action" onClick={handleShare}>
          <Send size={18} />
          Share · Demo
        </button>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
