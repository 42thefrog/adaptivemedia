import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { ArtifactTraits } from "./types.js";
import { LivingArtifact } from "./LivingArtifact.js";
import { ParticleField } from "./ParticleField.js";
import { SharedResonance } from "./SharedResonance.js";

export function ArtifactScene({ traits, quiet, update }: { traits: ArtifactTraits; quiet: boolean; update: (s: Partial<ArtifactTraits["signals"]>) => void }) {
  const peer = { ...traits, seed: traits.seed + 0.37, creativity: traits.creativity * 0.84, energy: traits.energy * 0.76 };
  return <Canvas
    dpr={[1, 1.7]}
    camera={{ position: [0, 0.15, 6.3], fov: 36 }}
    gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
  >
    <color attach="background" args={[quiet ? "#eef3f5" : "#f5f8f9"]} />
    <fog attach="fog" args={["#eef4f6", 6, 11]} />
    <ambientLight intensity={0.7} />
    <directionalLight position={[4, 5, 4]} intensity={2.1} color="#ffffff" />
    <pointLight position={[-3, -2, 2]} intensity={18} distance={7} color="#74c8ff" />
    <Suspense fallback={null}>
      <LivingArtifact traits={traits} onUpdate={update} />
      <ParticleField traits={traits} quiet={quiet} />
      {traits.signals.collaboration && <>
        <SharedResonance traits={traits} />
        <LivingArtifact traits={peer} onUpdate={() => undefined} position={[3.9, 0.12, -0.45]} scale={0.42} ghost />
      </>}
      <hemisphereLight args={["#ffffff", "#a9c6d8", 1.3]} />
    </Suspense>
  </Canvas>;
}
