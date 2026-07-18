import type { ArtifactMetrics, InteractionEvent } from "@/types";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Sources considered "structured / building" activity — nudges focus up. */
const STRUCTURED_SOURCES = new Set(["github", "reddit"]);
/** Sources considered "relational" activity — nudges connections up hardest. */
const RELATIONAL_SOURCES = new Set(["collaboration"]);

/**
 * Derives the five visible metrics from a raw interaction history.
 *
 * This is intentionally order- and timing-sensitive: two histories with the
 * same multiset of interaction types but different sequencing or pacing
 * will generally produce different metrics, which is what makes every
 * artifact's growth path unique even when the underlying content overlaps.
 */
export function computeMetrics(history: InteractionEvent[]): ArtifactMetrics {
  if (history.length === 0) {
    return {
      experienceLevel: 0,
      energy: 0.2,
      connections: 0,
      creativity: 0.15,
      focus: 0.2,
    };
  }

  const distinctSources = new Set(history.map((e) => e.type));
  const total = history.length;

  // --- experienceLevel: breadth of sources + sustained volume ---
  const experienceLevel = clamp01(
    distinctSources.size * 0.16 + Math.log2(total + 1) * 0.12
  );

  // --- timing irregularity: stddev of inter-event gaps, normalized ---
  let irregularity = 0.3;
  if (history.length > 2) {
    const gaps: number[] = [];
    for (let i = 1; i < history.length; i++) {
      gaps.push(history[i].timestamp - history[i - 1].timestamp);
    }
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance =
      gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length;
    const stddev = Math.sqrt(variance);
    // normalize against the mean gap so pacing (not raw ms) matters
    irregularity = clamp01(mean > 0 ? stddev / (mean + 250) : 0.3);
  }

  const savedInsightCount = history.filter(
    (e) => e.type === "savedInsight"
  ).length;
  const structuredCount = history.filter((e) =>
    STRUCTURED_SOURCES.has(e.type)
  ).length;
  const relationalCount = history.filter((e) =>
    RELATIONAL_SOURCES.has(e.type)
  ).length;

  // --- creativity: variety + irregular pacing + saved insights ---
  const creativity = clamp01(
    0.18 +
      distinctSources.size * 0.08 +
      irregularity * 0.35 +
      savedInsightCount * 0.07
  );

  // --- focus: opposite of chaos, rewarded by structured sources + steadiness ---
  const focus = clamp01(
    0.2 + (1 - irregularity) * 0.4 + structuredCount * 0.06
  );

  // --- connections: breadth of sources + collaboration weighted heavily ---
  const connections = clamp01(
    distinctSources.size * 0.12 + relationalCount * 0.28
  );

  // --- energy: recency-weighted activity, most recent events matter most ---
  const now = history[history.length - 1].timestamp;
  const recentWindow = 45_000; // 45s "just happened" window
  const recentCount = history.filter((e) => now - e.timestamp < recentWindow)
    .length;
  const energy = clamp01(0.25 + recentCount * 0.15 + total * 0.01);

  return { experienceLevel, energy, connections, creativity, focus };
}
