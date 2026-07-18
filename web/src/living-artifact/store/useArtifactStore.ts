import { create } from "zustand";
import type {
  ArtifactStore,
  InteractionInput,
  InteractionEvent,
} from "@/types";
import { computeMetrics } from "@/lib/metrics";
import { seedFromHistory } from "@/lib/hash";
import { stageFromExperience, stageTFromExperience } from "@/lib/evolution";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const ENERGY_DECAY_PER_SECOND = 0.02; // gentle drift back toward baseline at rest
const RESONANCE_DECAY_PER_SECOND = 0.15; // resonance fades faster than it builds — a connection needs upkeep

/**
 * Single source of truth for a Living Artifact's state.
 *
 * `<LivingArtifact />` and `<ParticleField />` both subscribe to this store
 * independently, so they stay in sync without prop drilling, and any other
 * part of the interface (a HUD, a "current stage" label, Shared Resonance
 * later on) can read the same values.
 *
 * The imperative API from the spec —
 *   artifact.update({ youtube: true, reddit: true, ... })
 * — is `useArtifactStore.getState().update(...)`. See `useLivingArtifactApi`
 * in NextboundExperience.tsx for the ergonomic wrapper.
 *
 * `createArtifactStore()` is exposed as a factory (rather than only a
 * singleton) so a future Shared Resonance pass can instantiate one store per
 * visible artifact — this build uses a single singleton instance, which is
 * all a one-artifact-per-user experience needs today.
 */
export function createArtifactStore() {
  return create<ArtifactStore>((set, get) => ({
  experienceLevel: 0,
  energy: 0.2,
  connections: 0,
  creativity: 0.15,
  focus: 0.2,
  stage: "seed",
  stageT: 0,
  profile: "balanced",
  seed: 0.42,
  history: [],
  isComplete: false,
  pulse: 0,
  lastInteractionType: null,
  resonance: 0,

  update: (input: InteractionInput) => {
    const now = performance.now();
    const newEvents: InteractionEvent[] = Object.entries(input)
      .filter(([, active]) => active === true)
      .map(([type], i) => ({ type, timestamp: now + i * 0.001 }));

    if (newEvents.length === 0) return;

    const history = [...get().history, ...newEvents];
    const metrics = computeMetrics(history);
    const seed = seedFromHistory(history);
    const stage = stageFromExperience(metrics.experienceLevel);
    const stageT = stageTFromExperience(metrics.experienceLevel);

    set((s) => ({
      ...metrics,
      // energy gets an immediate lift on interaction; tick() lets it settle
      energy: Math.max(metrics.energy, s.energy),
      history,
      seed,
      stage,
      stageT,
      pulse: s.pulse + 1,
      lastInteractionType: newEvents[newEvents.length - 1].type,
    }));
  },

  tick: (delta: number) => {
    const { energy, experienceLevel, isComplete, resonance } = get();
    if (isComplete) return;
    const baseline = 0.25 + experienceLevel * 0.2;
    const nextEnergy =
      Math.abs(energy - baseline) < 0.001
        ? energy
        : energy > baseline
        ? Math.max(baseline, energy - ENERGY_DECAY_PER_SECOND * delta)
        : Math.min(baseline, energy + ENERGY_DECAY_PER_SECOND * delta);
    const nextResonance =
      resonance <= 0.0005
        ? 0
        : Math.max(0, resonance - RESONANCE_DECAY_PER_SECOND * delta);
    if (nextEnergy !== energy || nextResonance !== resonance) {
      set({ energy: nextEnergy, resonance: nextResonance });
    }
  },

  setProfile: (profile) => set({ profile }),

  completeExperience: () => set({ isComplete: true }),

  receiveResonance: (strength: number, delta: number) => {
    const s = get();
    if (s.isComplete) return;
    const clampedStrength = clamp01(strength);
    // Resonance itself rises quickly toward the connection's strength...
    const nextResonance = Math.max(
      s.resonance,
      s.resonance + (clampedStrength - s.resonance) * Math.min(1, delta * 4)
    );
    // ...and the relationship gives energy/connections a small, bounded lift.
    // Bounded well below 1 so a permanent connection never silently maxes
    // out a metric on its own — interactions still matter most.
    const nextEnergy = clamp01(
      s.energy + clampedStrength * 0.05 * delta
    );
    const nextConnections = clamp01(
      s.connections + clampedStrength * 0.015 * delta
    );
    set({
      resonance: clamp01(nextResonance),
      energy: nextEnergy,
      connections: nextConnections,
    });
  },

  reset: () =>
    set({
      experienceLevel: 0,
      energy: 0.2,
      connections: 0,
      creativity: 0.15,
      focus: 0.2,
      stage: "seed",
      stageT: 0,
      seed: 0.42,
      history: [],
      isComplete: false,
      pulse: 0,
      lastInteractionType: null,
      resonance: 0,
    }),
  }));
}

/** Default singleton store — what most of the app should import. */
export const useArtifactStore = createArtifactStore();

export type ArtifactStoreHook = typeof useArtifactStore;
