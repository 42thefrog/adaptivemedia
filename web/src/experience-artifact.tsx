import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import type { ArtifactTraits, Identity, JourneySignals } from "./artifact/types.js";
import { evolve, evolutionStage } from "./artifact/evolution.js";

/**
 * The 3D scene is the newest, riskiest piece of this view (WebGL
 * availability, three.js/R3F version drift, GPU quirks). If it throws,
 * React would otherwise unmount everything above it up to the nearest
 * boundary — which, without this, is nothing, so the whole Experience
 * screen would go blank. This keeps a crash contained to the panel itself.
 */
class ArtifactErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[Nextbound] Living Artifact failed to render:", error);
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="artifact-loading artifact-loading--error" aria-hidden="true">
          <span>Your artifact couldn’t render in this browser.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-loaded: the Experience view is only one of five widget screens, and
// Three.js/R3F/drei are the heaviest thing in this bundle. Deferring the
// import means Discovery/Creator/Intent never pay for it.
const ArtifactScene = lazy(() =>
  import("./artifact/Scene.js").then((mod) => ({ default: mod.ArtifactScene })),
);

type PersonaId = "alex" | "camille" | "maya";

// Alex (Developer Student) / Camille (Curated Chaos Artistic Director) / Maya
// (Independent Creator) map onto the artifact system's three Adaptive
// Identity profiles — the same pairing the standalone artifact.html demo
// uses for its own identity copy ("Structured motion", "Fluid form",
// "Balanced form").
const identityByPersona: Record<PersonaId, Identity> = {
  alex: "developer",
  camille: "designer",
  maya: "founder",
};

const dormantSignals: JourneySignals = {
  youtube: false,
  reddit: false,
  github: false,
  savedInsight: false,
  collaboration: false,
};

function seedTraits(personaId: PersonaId): ArtifactTraits {
  return {
    experienceLevel: 0.08,
    energy: 0.32,
    connections: 0,
    creativity: 0.28,
    focus: 0.3,
    identity: identityByPersona[personaId] ?? "founder",
    seed: Math.random(),
    signals: dormantSignals,
  };
}

/**
 * Drives one Living Artifact for the Experience view. A fresh artifact is
 * seeded whenever the persona or the generated experience changes — a new
 * personalized experience is a new journey. Opening it is itself the first
 * signal (via a short delay so the reveal reads as a reaction, not a
 * pre-baked default), and `signal()` should be called from the view's real
 * interactions (like, follow, save, share, generate music) — never from a
 * timer or on mount for anything else, since the artifact should only ever
 * reflect what a user actually did.
 */
export function useExperienceArtifact(personaId: PersonaId, experienceId?: string) {
  const [traits, setTraits] = useState<ArtifactTraits>(() => seedTraits(personaId));
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setTraits(seedTraits(personaId));
    setComplete(false);
    const timer = window.setTimeout(
      () => setTraits((current) => evolve(current, { reddit: true })),
      280,
    );
    return () => window.clearTimeout(timer);
  }, [personaId, experienceId]);

  return {
    traits: complete
      ? { ...traits, experienceLevel: 1, energy: 0.82, focus: Math.max(traits.focus, 0.86) }
      : traits,
    complete,
    signal: (next: Partial<JourneySignals>) =>
      setTraits((current) => evolve(current, next)),
    markComplete: () => setComplete(true),
  };
}

export function ArtifactPanel({
  traits,
  complete,
  onSignal,
}: {
  traits: ArtifactTraits;
  complete: boolean;
  onSignal: (signal: Partial<JourneySignals>) => void;
}) {
  const stage = evolutionStage(traits.experienceLevel);
  return (
    <section className="artifact-panel" aria-label="Your Living Artifact">
      <div className="section-label">
        <span>Your Living Artifact</span>
        <span>{stage}</span>
      </div>
      <div className="artifact-canvas">
        <ArtifactErrorBoundary>
          <Suspense fallback={<div className="artifact-loading" aria-hidden="true" />}>
            <ArtifactScene traits={traits} quiet={complete} update={onSignal} />
          </Suspense>
        </ArtifactErrorBoundary>
      </div>
      <p className="artifact-caption">
        {complete
          ? "This experience now belongs to you."
          : "Every choice below leaves a trace — this form is becoming one only you could make."}
      </p>
    </section>
  );
}
