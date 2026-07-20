import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { installLocalPreview } from "./local-preview.js";
import "./afterlight.css";
import alexArtifact from "./assets/alex-executive-series.png";
import camilleArtifact from "./assets/camille-atelier-edition.png";
import mayaArtifact from "./assets/maya-studio-drop.png";
import originalArtifact from "./assets/nihe-sneakers.png";

type PersonaId = "alex" | "camille" | "maya";

const personas: Record<
  PersonaId,
  {
    name: string;
    accent: string;
    collection: string;
    role: string;
    headline: string;
    badge: string;
    score: string;
    detail: string;
    reason: string;
    artwork: string;
  }
> = {
  alex: {
    name: "Alex",
    accent: "#73a8ff",
    collection: "NIHE  |  EXECUTIVE SERIES",
    role: "CEO · tech company",
    headline: "Comfort that moves\nwith you.",
    badge: "Travel Ready",
    score: "98%",
    detail: "Comfort Match",
    reason:
      "Luna shared one artifact. For Alex, it becomes a travel-ready Executive Series experience.",
    artwork: alexArtifact,
  },
  camille: {
    name: "Camille",
    accent: "#c989bd",
    collection: "NIHE  |  ATELIER ÉDITION",
    role: "Artistic director",
    headline: "The architecture\nof softness.",
    badge: "Atelier selected",
    score: "96%",
    detail: "Taste Match",
    reason:
      "Luna shared one artifact. For Camille, it becomes an Atelier Édition shaped by form and feeling.",
    artwork: camilleArtifact,
  },
  maya: {
    name: "Maya",
    accent: "#74c7b0",
    collection: "NIHE  |  STUDIO DROP",
    role: "Developer",
    headline: "Built for the\ncreative sprint.",
    badge: "Creator Edition",
    score: "94%",
    detail: "Flow Match",
    reason:
      "Luna shared one artifact. For Maya, it becomes a Studio Drop for the daily build.",
    artwork: mayaArtifact,
  },
};

const initialOutput = () =>
  (window.openai?.toolOutput ?? window.openai?.widgetState?.data ?? {}) as any;

function App() {
  const local = useMemo(() => installLocalPreview(), []);
  const output = initialOutput();
  const initialExperience = output.experience;
  const [personaId, setPersonaId] = useState<PersonaId>(
    (initialExperience?.personaId as PersonaId) ?? "alex",
  );
  const [experience, setExperience] = useState<any>(initialExperience);
  const [phase, setPhase] = useState<"waiting" | "generating" | "final">(
    initialExperience ? "final" : "waiting",
  );
  const [artifactReady, setArtifactReady] = useState(
    Boolean(initialExperience),
  );
  const [generationStep, setGenerationStep] = useState(0);
  const [showOriginalArtifact, setShowOriginalArtifact] = useState(false);
  const [showPersonalArtifact, setShowPersonalArtifact] = useState(false);
  const [error, setError] = useState("");

  const persona = personas[personaId];

  useEffect(() => {
    window.openai?.setWidgetState?.({
      personaId,
      phase,
      data: experience ? { experience } : {},
    });
  }, [experience, personaId, phase]);

  useEffect(() => {
    if (phase !== "waiting" || artifactReady) return;
    const reveal = window.setTimeout(() => setArtifactReady(true), 650);
    return () => window.clearTimeout(reveal);
  }, [artifactReady, phase]);

  useEffect(() => {
    if (phase !== "generating") return;
    setGenerationStep(0);
    const first = window.setTimeout(() => setGenerationStep(1), 280);
    const second = window.setTimeout(() => setGenerationStep(2), 710);
    const third = window.setTimeout(() => setGenerationStep(3), 1130);
    const complete = window.setTimeout(() => setPhase("final"), 1750);
    return () => [first, second, third, complete].forEach(window.clearTimeout);
  }, [phase]);

  const generate = async (nextPersona = personaId) => {
    setError("");
    setPersonaId(nextPersona);
    setPhase("generating");
    const intentId = experience?.intentId ?? "intent_luna_main_character";
    try {
      const raw = await window.openai?.callTool?.("generate_experience", {
        intentId,
        personaId: nextPersona,
      });
      const response = (raw as any)?.structuredContent ?? raw;
      if (response?.error) throw new Error(response.error.message);
      if (!response?.experience) throw new Error("No experience was returned.");
      setExperience(response.experience);
    } catch (cause) {
      setPhase("waiting");
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not generate the experience.",
      );
    }
  };

  return (
    <main
      className="nb-shell"
      style={{ "--accent": persona.accent } as React.CSSProperties}
    >
      <header className="nb-header">
        <div>
          <b>Nextbound</b>
          <span>mcp · artifact</span>
        </div>
        <span className="nb-live">PERSONAL EXPERIENCE</span>
      </header>

      <section className="nb-stage">
        {phase !== "final" && (
          <>
            <div
              className={`nb-orb ${phase === "generating" ? "is-generating" : ""}`}
              aria-hidden="true"
            >
              {Array.from({ length: 22 }, (_, index) => (
                <i
                  key={index}
                  style={{ "--i": index } as React.CSSProperties}
                />
              ))}
            </div>
            {phase === "waiting" ? (
              <div className="nb-copy">
                <h1>Hello, {persona.name}.</h1>
                <p>
                  {artifactReady
                    ? "A creator artifact is waiting for you."
                    : "Waiting for creator artifact…"}
                </p>
                {artifactReady && (
                  <div className="nb-inbox">
                    <div className="nb-inbox-dot" aria-hidden="true" />
                    <div>
                      <b>Luna shared an artifact</b>
                      <span>Look what just arrived for you.</span>
                    </div>
                    <button
                      className="nb-primary"
                      onClick={() => void generate()}
                    >
                      nextbound me
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nb-thinking" aria-live="polite">
                <b>Generating experience…</b>
                {generationStep >= 1 && <span>• Reading context</span>}
                {generationStep >= 2 && <span>• Reading preferences</span>}
                {generationStep >= 3 && <span>• Building experience</span>}
              </div>
            )}
          </>
        )}

        {phase === "final" && experience && (
          <article className="nb-experience">
            <p className="nb-eyebrow">PERSONAL EXPERIENCE</p>
            <h1>AFTERLIGHT</h1>
            <p className="nb-summary">
              One creator.
              <br />
              Millions of personal experiences.
            </p>
            <SneakerArtifact
              persona={persona}
              onOpen={() => setShowPersonalArtifact(true)}
            />
            <p className="nb-reason">{persona.reason}</p>
            <button
              className="nb-original-link"
              onClick={() => setShowOriginalArtifact(true)}
            >
              View creator’s original artifact
            </button>
            <button
              className="nb-primary"
              onClick={() => {
                setArtifactReady(false);
                setPhase("waiting");
              }}
            >
              Continue
            </button>
            <div className="nb-switcher" aria-label="Preview another persona">
              {(Object.keys(personas) as PersonaId[]).map((id) => (
                <button
                  key={id}
                  className={id === personaId ? "active" : ""}
                  onClick={() => void generate(id)}
                >
                  {personas[id].name}
                </button>
              ))}
            </div>
          </article>
        )}
        {error && (
          <p className="nb-error" role="alert">
            {error}
          </p>
        )}
        {showOriginalArtifact && (
          <div
            className="nb-original-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Original creator artifact"
          >
            <div
              className="nb-original-backdrop"
              onClick={() => setShowOriginalArtifact(false)}
            />
            <article className="nb-original-sheet">
              <button
                className="nb-close"
                onClick={() => setShowOriginalArtifact(false)}
                aria-label="Close original artifact"
              >
                ×
              </button>
              <p className="nb-eyebrow">ORIGINAL CREATOR ARTIFACT</p>
              <h2>NIHE · White performance pair</h2>
              <p>
                Shared by Luna. This is the original artifact; Nextbound adapts
                its presentation, not its identity.
              </p>
              <img
                src={originalArtifact}
                alt="Original NIHE white performance sneakers"
              />
              <small>Creator attribution preserved · Luna Vale</small>
            </article>
          </div>
        )}
        {showPersonalArtifact && (
          <div
            className="nb-original-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${persona.name}'s personal artifact`}
          >
            <div
              className="nb-original-backdrop"
              onClick={() => setShowPersonalArtifact(false)}
            />
            <article className="nb-original-sheet nb-personal-sheet">
              <button
                className="nb-close"
                onClick={() => setShowPersonalArtifact(false)}
                aria-label="Close personal artifact"
              >
                ×
              </button>
              <p className="nb-eyebrow">PERSONAL ARTIFACT</p>
              <h2>{persona.name}</h2>
              <p>{persona.role}</p>
              <img
                src={persona.artwork}
                alt={`Full NIHE artifact personalized for ${persona.name}`}
              />
              <small>Adapted from Luna Vale’s original artifact</small>
            </article>
          </div>
        )}
      </section>
      {local && (
        <footer className="nb-footer">
          Local MCP preview · deterministic data
        </footer>
      )}
    </main>
  );
}

function SneakerArtifact({
  persona,
  onOpen,
}: {
  persona: (typeof personas)[PersonaId];
  onOpen: () => void;
}) {
  return (
    <div className="nb-artifact-card">
      <div className="nb-card-top">
        <span>{persona.collection} · {persona.role}</span>
        <small>for {persona.name}</small>
      </div>
      <h2>
        {persona.headline.split("\n").map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h2>
      <button
        type="button"
        className="nb-shoe-stage"
        aria-label={`NIHE sneaker curated for ${persona.name}`}
        onClick={onOpen}
      >
        <img
          className={`nb-sneaker ${persona.name === "Alex" ? "nb-sneaker-alex" : ""} ${persona.name === "Camille" ? "nb-sneaker-camille" : ""} ${persona.name === "Maya" ? "nb-sneaker-maya" : ""}`}
          src={persona.artwork}
          alt={`NIHE sneakers curated for ${persona.name}`}
        />
        <div className="nb-badge">
          <b>{persona.badge}</b>
          <span>Designed around your rhythm.</span>
        </div>
        <div className="nb-score">
          <b>{persona.score}</b>
          <span>{persona.detail}</span>
        </div>
        <span className="nb-expand-hint">Click to open artifact ↗</span>
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
