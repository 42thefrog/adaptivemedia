import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import type { ArtifactStoreHook } from "@/store/useArtifactStore";
import {
  computeAffinity,
  affinityToTargetStrength,
  stepConnectionStrength,
} from "@/lib/resonance";
import { ConnectionLine } from "./ConnectionLine";

export interface ResonancePeer {
  id: string;
  useStore: ArtifactStoreHook;
  /** World position of this artifact. Assumed roughly static (artifacts
   * float only slightly around their base position), so connections don't
   * need per-frame geometry rebuilding. */
  position: [number, number, number];
}

export interface SharedResonanceFieldProps {
  peers: ResonancePeer[];
  /** Beyond this world-space distance, artifacts are never "nearby" — no
   * connection forms regardless of how similar their journeys are. */
  detectionRadius?: number;
  color?: string;
}

function distance(a: [number, number, number], b: [number, number, number]) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Shared Resonance — the layer that lets Living Artifacts become aware of
 * each other. No avatars, no identity beyond the artifacts themselves:
 * every relationship in Nextbound is represented purely by how two
 * artifacts' forms and light behave toward one another.
 *
 * For every pair of peers, each frame: check proximity, score how alike
 * their current journeys are (`computeAffinity`), and smoothly move a
 * connection strength toward that score (`stepConnectionStrength` — forms
 * slower than it fades, so drifting apart reads as a real, natural
 * dissolve rather than a flicker). While connected, both artifacts receive
 * a small, bounded nudge via `receiveResonance` — the relationship visibly
 * touches both sides.
 */
export function SharedResonanceField({
  peers,
  detectionRadius = 7,
  color = "#bcdcff",
}: SharedResonanceFieldProps) {
  const pairs = useMemo(() => {
    const list: {
      a: ResonancePeer;
      b: ResonancePeer;
      strengthRef: { current: number };
    }[] = [];
    for (let i = 0; i < peers.length; i++) {
      for (let j = i + 1; j < peers.length; j++) {
        list.push({ a: peers[i], b: peers[j], strengthRef: { current: 0 } });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peers]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 1 / 20);

    for (const pair of pairs) {
      const sa = pair.a.useStore.getState();
      const sb = pair.b.useStore.getState();

      const dist = distance(pair.a.position, pair.b.position);
      let target = 0;

      if (dist <= detectionRadius && !sa.isComplete && !sb.isComplete) {
        const affinity = computeAffinity(
          {
            creativity: sa.creativity,
            focus: sa.focus,
            connections: sa.connections,
            profile: sa.profile,
            stage: sa.stage,
          },
          {
            creativity: sb.creativity,
            focus: sb.focus,
            connections: sb.connections,
            profile: sb.profile,
            stage: sb.stage,
          }
        );
        const proximityFade =
          1 -
          Math.max(
            0,
            Math.min(1, (dist - detectionRadius * 0.6) / (detectionRadius * 0.4))
          );
        target = affinityToTargetStrength(affinity) * proximityFade;
      }

      pair.strengthRef.current = stepConnectionStrength(
        pair.strengthRef.current,
        target,
        d
      );

      if (pair.strengthRef.current > 0.02) {
        sa.receiveResonance(pair.strengthRef.current, d);
        sb.receiveResonance(pair.strengthRef.current, d);
      }
    }
  });

  return (
    <group>
      {pairs.map((pair) => (
        <ConnectionLine
          key={`${pair.a.id}-${pair.b.id}`}
          a={pair.a.position}
          b={pair.b.position}
          strengthRef={pair.strengthRef}
          color={color}
        />
      ))}
    </group>
  );
}
