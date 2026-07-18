import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ArtifactTraits } from "./types.js";

export function SharedResonance({ traits }: { traits: ArtifactTraits }) {
  const pulse = useRef<THREE.Mesh>(null);
  const strength = traits.connections;
  const points = useMemo(() => Array.from({ length: 28 }, (_, i) => {
    const u = i / 27;
    return new THREE.Vector3(1.05 + u * 2.38, Math.sin(u * Math.PI) * 0.15, Math.sin(u * Math.PI * 2) * 0.05);
  }), []);
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const connectionLine = useMemo(() => new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: "#78c8f2", transparent: true, opacity: 0.22 + strength * 0.28 })), [lineGeometry, strength]);
  useFrame(({ clock }) => {
    if (!pulse.current) return;
    const u = (clock.elapsedTime * 0.1) % 1;
    pulse.current.position.copy(points[Math.floor(u * (points.length - 1))]);
  });
  if (strength < 0.22) return null;
  return <group>
    <primitive object={connectionLine} />
    <mesh ref={pulse}><sphereGeometry args={[0.027, 10, 10]} /><meshBasicMaterial color="#e8fbff" toneMapped={false} /></mesh>
  </group>;
}
