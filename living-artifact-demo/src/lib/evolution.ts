import type { EvolutionStage } from "@/types";
import { EVOLUTION_STAGES } from "@/types";

/**
 * Evolution engine (pure functions — no React, no Three).
 *
 * The artifact's identity (base shape, seed, palette family) never changes.
 * What evolves is complexity: how much detail the geometry carries, how
 * bright and layered the light is, how dense the particle field is, and how
 * much internal glow the core radiates. Every one of those is driven off a
 * single continuous scalar, `stageT` (0 → 3, Seed → Masterpiece), so nothing
 * ever has to hard-cut between states.
 */

export interface StageAnchor {
  /** Icosahedron subdivision detail (integer, drives vertex/face count). */
  geometryDetail: number;
  /** Displacement noise octave count (visual "structural detail"). */
  noiseOctaves: number;
  /** Key light intensity multiplier. */
  lightIntensity: number;
  /** Core / rim glow intensity multiplier. */
  glowIntensity: number;
  /** Target particle count. */
  particleCount: number;
  /** How far particles range from the artifact core. */
  particleSpread: number;
}

export const STAGE_ANCHORS: Record<EvolutionStage, StageAnchor> = {
  seed: {
    geometryDetail: 2,
    noiseOctaves: 1,
    lightIntensity: 0.55,
    glowIntensity: 0.35,
    particleCount: 90,
    particleSpread: 1.6,
  },
  growing: {
    geometryDetail: 3,
    noiseOctaves: 2,
    lightIntensity: 0.75,
    glowIntensity: 0.55,
    particleCount: 220,
    particleSpread: 2.1,
  },
  complex: {
    geometryDetail: 4,
    noiseOctaves: 3,
    lightIntensity: 0.95,
    glowIntensity: 0.8,
    particleCount: 420,
    particleSpread: 2.7,
  },
  masterpiece: {
    geometryDetail: 5,
    noiseOctaves: 4,
    lightIntensity: 1.2,
    glowIntensity: 1.05,
    particleCount: 640,
    particleSpread: 3.3,
  },
};

/** experienceLevel (0..1) → discrete stage label, for UI display. */
export function stageFromExperience(experienceLevel: number): EvolutionStage {
  if (experienceLevel < 0.25) return "seed";
  if (experienceLevel < 0.55) return "growing";
  if (experienceLevel < 0.85) return "complex";
  return "masterpiece";
}

/** experienceLevel (0..1) → continuous 0..3 position across the four stages. */
export function stageTFromExperience(experienceLevel: number): number {
  return Math.min(experienceLevel, 0.999) * EVOLUTION_STAGES.length - 0.0005;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smoothly interpolates a StageAnchor field across the continuous stageT. */
export function sampleAnchor(stageT: number): StageAnchor {
  const clamped = Math.max(0, Math.min(stageT, EVOLUTION_STAGES.length - 1e-4));
  const lowerIndex = Math.floor(clamped);
  const t = clamped - lowerIndex;
  const lower = STAGE_ANCHORS[EVOLUTION_STAGES[lowerIndex]];
  const upperStage =
    EVOLUTION_STAGES[Math.min(lowerIndex + 1, EVOLUTION_STAGES.length - 1)];
  const upper = STAGE_ANCHORS[upperStage];

  return {
    geometryDetail: Math.round(lerp(lower.geometryDetail, upper.geometryDetail, t)),
    // Kept fractional on purpose: fbm() blends octaves smoothly, so detail
    // ramps in continuously instead of popping between integers.
    noiseOctaves: lerp(lower.noiseOctaves, upper.noiseOctaves, t),
    lightIntensity: lerp(lower.lightIntensity, upper.lightIntensity, t),
    glowIntensity: lerp(lower.glowIntensity, upper.glowIntensity, t),
    particleCount: Math.round(lerp(lower.particleCount, upper.particleCount, t)),
    particleSpread: lerp(lower.particleSpread, upper.particleSpread, t),
  };
}

/** Fixed upper bound on allocated particles — the Masterpiece target count.
 * ParticleField always allocates this many GPU points; fewer are simply
 * faded to zero alpha at render time, so particle density can grow smoothly
 * with no buffer reallocation. */
export const MAX_PARTICLES = STAGE_ANCHORS.masterpiece.particleCount;
