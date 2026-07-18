import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useArtifactStore, ArtifactStoreHook } from "@/store/useArtifactStore";
import { sampleAnchor } from "@/lib/evolution";
import { PROFILE_BIAS } from "@/lib/profiles";
import { damp } from "@/lib/math";
import { ArtifactMaterialImpl, GlowMaterialImpl } from "./ArtifactMaterial";

export interface LivingArtifactProps {
  /** Which store to read from — defaults to the app-wide singleton. Pass a
   * distinct store (from `createArtifactStore()`) to render more than one
   * artifact at once (e.g. for a future Shared Resonance view). */
  useStore?: ArtifactStoreHook;
  position?: [number, number, number];
  /** Base radius in world units. */
  radius?: number;
}

const geometryCache = new Map<number, THREE.IcosahedronGeometry>();
function getGeometry(detail: number, radius: number) {
  const key = detail * 1000 + Math.round(radius * 100);
  let geo = geometryCache.get(key);
  if (!geo) {
    geo = new THREE.IcosahedronGeometry(radius, detail);
    geometryCache.set(key, geo);
  }
  return geo;
}

/**
 * The Living Artifact — Nextbound's core visual identity. An organic,
 * semi-transparent glass form that never stops breathing, drifting and
 * slowly reshaping itself in response to a user's ongoing activity.
 *
 * All motion here is driven by continuously-smoothed values (see `damp`
 * calls below), so store updates — even large, sudden ones from
 * `artifact.update()` — never cause a visible pop. Only geometry
 * subdivision (which must be an integer) changes in a discrete step, masked
 * by a short "growth pulse" scale animation.
 */
export function LivingArtifact({
  useStore = useArtifactStore,
  position = [0, 0, 0],
  radius = 1,
}: LivingArtifactProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coreMaterial = useMemo(() => new ArtifactMaterialImpl(), []);
  const glowMaterial = useMemo(() => new GlowMaterialImpl(), []);
  const lightRef = useRef<THREE.PointLight>(null);

  const smoothed = useRef({
    energy: 0.2,
    creativity: 0.15,
    focus: 0.2,
    stageT: 0,
    seed: 0.42,
    sharpness: 0.2,
    rotationSpeed: 1,
    lightIntensity: 0.55,
    glowIntensity: 0.35,
    resonance: 0,
  });

  const detailRef = useRef(2);
  const pulseEnvelope = useRef(0); // 0..1, decays after a growth pulse
  const lastPulseId = useRef(-1);
  const colorB = useRef(new THREE.Color("#7fb8ff"));

  // Gentle, non-repeating float path — a few offset sine waves rather than
  // one clean loop, so it never reads as "on rails".
  const floatSeed = useMemo(() => Math.random() * 10, []);

  useFrame((state, delta) => {
    const s = useStore.getState();
    const d = Math.min(delta, 1 / 30); // clamp huge tab-away deltas
    const t = state.clock.elapsedTime;

    const sm = smoothed.current;
    sm.energy = damp(sm.energy, s.energy, 3, d);
    sm.creativity = damp(sm.creativity, s.creativity, 2.2, d);
    sm.focus = damp(sm.focus, s.focus, 2.2, d);
    sm.stageT = damp(sm.stageT, s.stageT, 1.6, d);
    sm.seed = damp(sm.seed, s.seed, 1.2, d);
    sm.resonance = damp(sm.resonance, s.resonance, 3, d);

    const bias = PROFILE_BIAS[s.profile];
    sm.sharpness = damp(sm.sharpness, bias.sharpness, 1.5, d);
    sm.rotationSpeed = damp(sm.rotationSpeed, bias.rotationSpeed, 1.5, d);
    colorB.current.lerp(bias.colorB, 1 - Math.exp(-1.2 * d));

    const anchor = sampleAnchor(sm.stageT);
    sm.lightIntensity = damp(sm.lightIntensity, anchor.lightIntensity, 2, d);
    sm.glowIntensity = damp(sm.glowIntensity, anchor.glowIntensity, 2, d);

    // Discrete geometry swap, masked with a soft growth pulse.
    if (anchor.geometryDetail !== detailRef.current) {
      detailRef.current = anchor.geometryDetail;
      pulseEnvelope.current = 1;
    }
    if (s.pulse !== lastPulseId.current) {
      lastPulseId.current = s.pulse;
      pulseEnvelope.current = Math.max(pulseEnvelope.current, 0.6);
    }
    pulseEnvelope.current = damp(pulseEnvelope.current, 0, 2.5, d);

    const core = coreRef.current;
    const glow = glowRef.current;
    const mat = coreMaterial;
    const glowMat = glowMaterial;
    if (!core || !glow || !mat || !glowMat) return;

    if (core.geometry !== getGeometry(detailRef.current, radius)) {
      core.geometry = getGeometry(detailRef.current, radius);
    }

    const u = mat.uniforms;
    u.uTime.value = t;
    u.uSeed.value = sm.seed;
    u.uEnergy.value = sm.energy;
    u.uCreativity.value = sm.creativity;
    u.uFocus.value = sm.focus;
    u.uOctaves.value = anchor.noiseOctaves;
    u.uSharpness.value = sm.sharpness;
    u.uGlow.value = sm.glowIntensity;
    u.uColorB.value = colorB.current;
    u.uResonance.value = sm.resonance;

    const gu = glowMat.uniforms;
    gu.uTime.value = t;
    gu.uEnergy.value = sm.energy;
    gu.uIntensity.value = sm.glowIntensity * 0.9;
    gu.uColor.value = colorB.current;

    if (lightRef.current) {
      lightRef.current.intensity = sm.lightIntensity * 2.2;
    }

    // Breathing + growth pulse.
    const breathe =
      1 + Math.sin(t * (0.55 + sm.energy * 0.35)) * (0.035 + sm.energy * 0.02);
    const pulseBoost = 1 + pulseEnvelope.current * 0.05;
    const scale = breathe * pulseBoost;
    core.scale.setScalar(scale);
    glow.scale.setScalar(scale * 1.22);

    // Slow rotation with a subtle wobble — feels alive, not mechanical.
    const rotSpeed = (0.045 + sm.energy * 0.03) * sm.rotationSpeed;
    core.rotation.y += rotSpeed * d;
    core.rotation.x = Math.sin(t * 0.13 + floatSeed) * 0.06;
    core.rotation.z = Math.cos(t * 0.09 + floatSeed) * 0.04;
    glow.rotation.copy(core.rotation);

    // Floating drift — layered sines at different frequencies/phases.
    core.position.set(
      position[0] + Math.sin(t * 0.18 + floatSeed) * 0.12,
      position[1] + Math.sin(t * 0.27 + floatSeed * 1.7) * 0.16,
      position[2] + Math.cos(t * 0.15 + floatSeed * 0.6) * 0.1
    );
    glow.position.copy(core.position);
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <primitive
          object={getGeometry(3, radius * 1.05)}
          attach="geometry"
        />
        <primitive object={glowMaterial} attach="material" />
      </mesh>
      <mesh ref={coreRef}>
        <primitive object={getGeometry(2, radius)} attach="geometry" />
        <primitive object={coreMaterial} attach="material" />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[position[0] + 1.5, position[1] + 2, position[2] + 1.5]}
        color="#bcdcff"
        intensity={1.2}
        distance={12}
        decay={2}
      />
    </group>
  );
}
