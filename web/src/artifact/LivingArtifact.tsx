import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ArtifactHandle, ArtifactTraits } from "./types.js";

interface Props { traits: ArtifactTraits; onUpdate: ArtifactHandle["update"]; position?: [number, number, number]; scale?: number; ghost?: boolean }

export const LivingArtifact = forwardRef<ArtifactHandle, Props>(function LivingArtifact(
  { traits, onUpdate, position = [0, 0, 0], scale = 1, ghost = false }, ref,
) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const identityShape = traits.identity === "developer" ? 0.45 : traits.identity === "designer" ? 1 : 0.68;
  const detail = Math.round(3 + traits.experienceLevel * 2);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, detail), [detail]);
  const basePositions = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  useImperativeHandle(ref, () => ({ update: onUpdate }), [onUpdate]);

  useFrame(({ clock }, delta) => {
    if (!group.current || !mesh.current) return;
    const t = clock.elapsedTime;
    group.current.position.y = position[1] + Math.sin(t * 0.48 + traits.seed * 6) * 0.09 * scale;
    group.current.rotation.y += delta * (0.055 + traits.energy * 0.045);
    group.current.rotation.z = Math.sin(t * 0.18 + traits.seed) * 0.045;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const breathing = 1 + Math.sin(t * 0.85) * (0.018 + traits.energy * 0.013);
    for (let i = 0; i < pos.count; i++) {
      const x = basePositions[i * 3], y = basePositions[i * 3 + 1], z = basePositions[i * 3 + 2];
      const wave = Math.sin(x * (2.2 + traits.focus) + t * 0.38 + traits.seed * 8)
        * Math.cos(y * (2.1 + traits.creativity) - t * 0.27)
        * (0.035 + traits.creativity * 0.07);
      const structure = Math.sin((x + z) * 4 + traits.seed * 12) * identityShape * 0.025;
      const radius = breathing + wave + structure;
      pos.setXYZ(i, x * radius, y * radius * (1 + traits.experienceLevel * 0.12), z * radius);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    if (core.current) core.current.scale.setScalar(0.58 + Math.sin(t * 1.1) * 0.025 + traits.energy * 0.1);
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh ref={core} scale={0.62}>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial color={ghost ? "#9db5c9" : "#dff5ff"} emissive="#75cfff" emissiveIntensity={ghost ? 0.7 : 1.5 + traits.energy * 2.6} roughness={0.3} transparent opacity={ghost ? 0.34 : 0.72} />
      </mesh>
      <mesh ref={mesh} geometry={geometry}>
        <meshPhysicalMaterial
          color={traits.identity === "designer" ? "#e8f7ff" : "#d9efff"}
          roughness={0.12}
          metalness={0.02}
          transmission={0.94}
          thickness={0.65 + traits.experienceLevel * 0.45}
          ior={1.22}
          clearcoat={1}
          clearcoatRoughness={0.12}
          transparent
          opacity={ghost ? 0.42 : 0.88}
        />
      </mesh>
    </group>
  );
});
