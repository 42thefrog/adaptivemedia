import type { ArtifactTraits, EvolutionStage, JourneySignals } from "./types.js";

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function evolutionStage(level: number): EvolutionStage {
  if (level < 0.25) return "Seed";
  if (level < 0.5) return "Growing";
  if (level < 0.78) return "Complex";
  return "Masterpiece";
}

export function evolve(
  current: ArtifactTraits,
  update: Partial<JourneySignals>,
  eventTime = performance.now(),
): ArtifactTraits {
  const signals = { ...current.signals, ...update };
  const active = Object.values(signals).filter(Boolean).length;
  const newEvents = Object.entries(update).filter(
    ([key, value]) => value && !current.signals[key as keyof JourneySignals],
  ).length;
  const timingSignature = (Math.sin(eventTime * 0.0017) + 1) * 0.5;

  return {
    ...current,
    signals,
    experienceLevel: clamp01(current.experienceLevel + newEvents * 0.105),
    energy: clamp01(0.28 + active * 0.11 + timingSignature * 0.12),
    connections: clamp01(0.12 + (signals.collaboration ? 0.52 : 0) + (signals.github ? 0.18 : 0)),
    creativity: clamp01(0.3 + (signals.reddit ? 0.18 : 0) + (signals.savedInsight ? 0.24 : 0) + timingSignature * 0.08),
    focus: clamp01(0.38 + (signals.savedInsight ? 0.32 : 0) + (signals.youtube ? 0.08 : 0)),
    seed: (current.seed * 1.618033 + eventTime * 0.00001 + newEvents * 0.137) % 1,
  };
}
