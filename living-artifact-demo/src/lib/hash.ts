import type { InteractionEvent } from "@/types";

/**
 * Deterministic 32-bit string hash (xfnv1a). Used to turn a user's
 * interaction history into a stable per-artifact seed.
 */
function xfnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Derives a stable 0..1 seed from an interaction history.
 *
 * Two users who trigger the exact same interaction *types* will still get
 * different seeds if the order or timing differs, because both are folded
 * into the hash input. This is what keeps two "identical" journeys from
 * producing identical artifacts.
 */
export function seedFromHistory(history: InteractionEvent[]): number {
  if (history.length === 0) return 0.42; // stable default for a fresh Seed
  const first = history[0].timestamp;
  const signature = history
    .map((e, i) => `${i}:${e.type}:${Math.round((e.timestamp - first) / 25)}`)
    .join("|");
  const hashed = xfnv1a(signature);
  return hashed / 4294967295;
}

/** Small deterministic PRNG (mulberry32) seeded from a 0..1 float. */
export function createRng(seed: number) {
  let a = Math.floor(seed * 4294967295) >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
