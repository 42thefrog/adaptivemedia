import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ArtifactTraits } from "./types.js";

export function ParticleField({ traits, quiet = false }: { traits: ArtifactTraits; quiet?: boolean }) {
  const points = useRef<THREE.Points>(null);
  const count = Math.round((quiet ? 68 : 110) + traits.experienceLevel * 170);
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const phases = useMemo(() => Float32Array.from({ length: count }, (_, i) => (i * 2.39996 + traits.seed * 9) % (Math.PI * 2)), [count, traits.seed]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const p = phases[i];
      const layer = (i % 9) / 9;
      const organized = traits.signals.reddit ? Math.round(layer * 5) / 5 : layer;
      const radius = quiet ? 1.42 + layer * 0.38 : 1.52 + organized * 1.18;
      const speed = 0.045 + traits.energy * 0.06 + (i % 5) * 0.004;
      const gather = traits.signals.savedInsight ? 0.82 + 0.18 * Math.sin(t * 0.32 + p) : 1;
      positions[i * 3] = Math.cos(p + t * speed) * radius * gather;
      positions[i * 3 + 1] = Math.sin(p * 1.7 + t * speed * 0.8) * (0.52 + organized * 0.95) * gather;
      positions[i * 3 + 2] = Math.sin(p + t * speed) * radius * 0.62 * gather;
    }
    if (points.current) (points.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color={traits.signals.youtube ? "#68bfff" : "#b9d8e7"} size={0.018} sizeAttenuation transparent opacity={quiet ? 0.42 : 0.72} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
