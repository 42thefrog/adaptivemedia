import type { ArtifactProfile, EvolutionStage } from "@/types";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export interface ResonanceSnapshot {
  creativity: number;
  focus: number;
  connections: number;
  profile: ArtifactProfile;
  stage: EvolutionStage;
}

/**
 * How alike two artifacts' current journeys are, 0..1. Deliberately about
 * the *shape* of an experience — creative direction, focus, breadth of
 * connections, adaptive identity — rather than raw content overlap. Two
 * users who consumed completely different content but arrived at a
 * similarly exploratory, unfocused, highly-connected state will still read
 * as resonant; two users who both watched the same video won't
 * automatically connect if one turned it into a focused deep-dive and the
 * other treated it as one stop among many.
 */
export function computeAffinity(a: ResonanceSnapshot, b: ResonanceSnapshot): number {
  const closeness =
    1 -
    (Math.abs(a.creativity - b.creativity) +
      Math.abs(a.focus - b.focus) +
      Math.abs(a.connections - b.connections)) /
      3;

  const profileMatch =
    a.profile === b.profile
      ? 1
      : a.profile === "balanced" || b.profile === "balanced"
      ? 0.55
      : 0.25;

  const stageMatch = a.stage === b.stage ? 1 : 0.5;

  return clamp01(closeness * 0.55 + profileMatch * 0.3 + stageMatch * 0.15);
}

/**
 * Smoothstep response curve: below `floor`, no connection forms at all;
 * above `ceil`, it's fully formed. The S-curve in between keeps borderline
 * pairs from flickering in and out as metrics drift by a hundredth.
 */
export function affinityToTargetStrength(
  affinity: number,
  floor = 0.42,
  ceil = 0.82
): number {
  const t = clamp01((affinity - floor) / (ceil - floor));
  return t * t * (3 - 2 * t);
}

/**
 * Asymmetric smoothing for connection strength: forms noticeably slower
 * than it fades. Artifacts "slowly detect each other" (spec) but a
 * diverging pair should visibly and promptly let go rather than lingering —
 * a connection that never really fades doesn't read as alive.
 */
export function stepConnectionStrength(
  current: number,
  target: number,
  delta: number,
  attackPerSecond = 0.35,
  releasePerSecond = 0.55
): number {
  const rate = target > current ? attackPerSecond : releasePerSecond;
  const maxStep = rate * delta;
  const diff = target - current;
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}
