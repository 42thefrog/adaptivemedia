import { Suspense, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  Environment,
  OrbitControls,
  PerformanceMonitor,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export interface SceneProps {
  children: ReactNode;
  /** Lets the consuming app opt out of drag-to-orbit for embedded/HUD contexts. */
  interactive?: boolean;
  /** Slow ambient auto-rotation — off by default lets a parent UI drive the camera instead. */
  autoRotate?: boolean;
  /** Override the default single-artifact framing — useful for wider,
   * multi-artifact scenes like Shared Resonance. */
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  minDistance?: number;
  maxDistance?: number;
}

/**
 * The Canvas shell: camera, lighting, environment reflections and
 * postprocessing (bloom is what turns the artifact's fresnel rim into a
 * genuine glow). Kept deliberately minimal — one key light, one soft
 * environment map, no gaming-style spotlights or lens flares.
 *
 * Performance: PerformanceMonitor + AdaptiveDpr quietly lower resolution
 * under sustained frame drops (typically weaker mobile GPUs) instead of
 * hard-coding a device check.
 */
export function Scene({
  children,
  interactive = true,
  autoRotate = false,
  cameraPosition = [0, 0.4, 5.2],
  cameraFov = 42,
  minDistance = 3.2,
  maxDistance = 8,
}: SceneProps) {
  const [dpr, setDpr] = useState<number>(
    typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1.5
  );

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      camera={{ position: cameraPosition, fov: cameraFov, near: 0.1, far: 80 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#05070c", 1);
      }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((v) => Math.max(1, v - 0.5))}
        onIncline={() => setDpr((v) => Math.min(2, v + 0.25))}
      />
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />

      <ambientLight intensity={0.35} color="#dbe9ff" />
      <directionalLight
        position={[3, 4, 2]}
        intensity={0.6}
        color="#ffffff"
      />

      <Suspense fallback={null}>
        <Environment preset="studio" blur={1} />
        {children}
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.85}
          luminanceThreshold={0.18}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={0.8}
        />
        <Vignette
          eskil={false}
          offset={0.25}
          darkness={0.6}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>

      <OrbitControls
        enabled={interactive}
        enablePan={false}
        enableZoom={interactive}
        minDistance={minDistance}
        maxDistance={maxDistance}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.78}
        autoRotate={autoRotate}
        autoRotateSpeed={0.4}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}
