/**
 * Nextbound — Living Artifact
 * Shared type definitions.
 *
 * These types are intentionally a little wider than the "Core" feature set
 * built in this pass (LivingArtifact + ParticleField + Evolution), so that
 * Shared Resonance and Adaptive Identity can be layered on later without
 * changing the public API.
 */

/** The four stages a Living Artifact grows through. Order matters. */
export type EvolutionStage = "seed" | "growing" | "complex" | "masterpiece";

export const EVOLUTION_STAGES: EvolutionStage[] = [
  "seed",
  "growing",
  "complex",
  "masterpiece",
];

/**
 * Adaptive Identity profile. Subtly biases geometry, palette and particle
 * behaviour. "balanced" is the neutral default and is what ships visually
 * in this pass — the per-profile shaping hooks are wired through the store
 * and shader uniforms so a future pass can lean into them further.
 */
export type ArtifactProfile = "developer" | "designer" | "founder" | "balanced";

/**
 * A single logged interaction. Order and timing of these — not just which
 * ones happened — is what makes every artifact's growth path unique, even
 * for two users who nominally "did the same things".
 */
export interface InteractionEvent {
  type: string;
  timestamp: number;
}

/**
 * Public interaction payload. Any boolean flag set to `true` is treated as
 * "this happened just now" and is logged as an event. `false` / omitted
 * flags are ignored (a Living Artifact only grows forward — interactions
 * are never retroactively un-lived).
 *
 * The known keys below map to the examples in the spec; the index signature
 * lets new interaction sources be added without breaking the API.
 */
export interface InteractionInput {
  youtube?: boolean;
  reddit?: boolean;
  github?: boolean;
  savedInsight?: boolean;
  collaboration?: boolean;
  [source: string]: boolean | undefined;
}

/** The five visible dimensions of an artifact's state. All normalized 0..1. */
export interface ArtifactMetrics {
  /** Cumulative growth toward Masterpiece. Drives evolution stage. */
  experienceLevel: number;
  /** Current vibrancy / brightness. Spikes on activity, decays slowly at rest. */
  energy: number;
  /** Breadth + depth of relationships — distinct sources, collaboration. */
  connections: number;
  /** Organic irregularity / asymmetry of the form. */
  creativity: number;
  /** Coherence and structure of motion and geometry. */
  focus: number;
}

export interface ArtifactState extends ArtifactMetrics {
  stage: EvolutionStage;
  /** Continuous 0..3 position along Seed→Growing→Complex→Masterpiece. */
  stageT: number;
  profile: ArtifactProfile;
  /** Deterministic per-artifact seed derived from the interaction history. */
  seed: number;
  history: InteractionEvent[];
  /** True once the current experience/session has been marked complete. */
  isComplete: boolean;
  /** Monotonically increasing token, bumped on every interaction — used to trigger particle "arrival" bursts without storing transient state. */
  pulse: number;
  lastInteractionType: string | null;
  /**
   * Shared Resonance: 0..1 "aware of another artifact" signal. Rises while
   * this artifact is connected to a nearby one with a similar journey,
   * decays back to 0 on its own once the connection fades. Deliberately
   * kept separate from the five public metrics — it's a relational glow,
   * not a personal growth dimension.
   */
  resonance: number;
}

export interface ArtifactActions {
  /** Apply an interaction payload. Mirrors `artifact.update({...})` from the spec. */
  update: (input: InteractionInput) => void;
  /** Advance idle/decay simulation. Call once per frame with delta seconds. */
  tick: (delta: number) => void;
  setProfile: (profile: ArtifactProfile) => void;
  completeExperience: () => void;
  reset: () => void;
  /**
   * Shared Resonance hook: called every frame a connection to another
   * artifact is active, with the connection's current 0..1 strength. Lifts
   * `resonance` toward that strength and gives `energy`/`connections` a
   * small bounded nudge — the artifact "reacting" to the relationship.
   */
  receiveResonance: (strength: number, delta: number) => void;
}

export type ArtifactStore = ArtifactState & ArtifactActions;
