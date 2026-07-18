import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ArtifactStoreHook, useArtifactStore } from "@/store/useArtifactStore";
import { sampleAnchor, MAX_PARTICLES } from "@/lib/evolution";
import { damp } from "@/lib/math";
import { PARTICLE_BEHAVIOR } from "@/shaders/particleShader";
import { ParticleMaterialImpl } from "./ParticleMaterial";
import { ConnectionTrails } from "./ConnectionTrails";

export interface ParticleFieldProps {
  useStore?: ArtifactStoreHook;
  position?: [number, number, number];
}

const BATCH_SIZE = 26;

/** Maps a raw interaction source name to a particle behavior code. Unknown
 * sources default to ARRIVE — "something new just showed up". */
function behaviorForType(type: string | null): number {
  switch (type) {
    case "youtube":
      return PARTICLE_BEHAVIOR.ARRIVE;
    case "reddit":
    case "github":
      return PARTICLE_BEHAVIOR.ORGANIZE;
    case "savedInsight":
      return PARTICLE_BEHAVIOR.FLOW_TO_CORE;
    case "collaboration":
      return PARTICLE_BEHAVIOR.CONNECT;
    default:
      return PARTICLE_BEHAVIOR.ARRIVE;
  }
}

function randomFarPoint(radius: number): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * The particle field orbiting a Living Artifact — one intelligent, meaningful
 * swarm rather than isolated effects. A large ambient shell (GPU-animated,
 * cheap) always orbits the core; specific interactions temporarily redirect
 * small batches of that same shell into arrival, organize, or flow-to-core
 * behaviors, then release them back into the ambient orbit.
 */
export function ParticleField({
  useStore = useArtifactStore,
  position = [0, 0, 0],
}: ParticleFieldProps) {
  const materialRef = useRef<InstanceType<typeof ParticleMaterialImpl>>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const position3 = new Float32Array(MAX_PARTICLES * 3); // required by three; unused in-shader
    const aIndex = new Float32Array(MAX_PARTICLES);
    const aSeed = new Float32Array(MAX_PARTICLES);
    const aPhi = new Float32Array(MAX_PARTICLES);
    const aThetaOffset = new Float32Array(MAX_PARTICLES);
    const aRadiusBase = new Float32Array(MAX_PARTICLES);
    const aSpeedVar = new Float32Array(MAX_PARTICLES);
    const aBehavior = new Float32Array(MAX_PARTICLES);
    const aBirth = new Float32Array(MAX_PARTICLES).fill(-1000);
    const aStart = new Float32Array(MAX_PARTICLES * 3);
    const aPatternSlot = new Float32Array(MAX_PARTICLES);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      aIndex[i] = i;
      aSeed[i] = Math.random();
      aPhi[i] = Math.acos(2 * Math.random() - 1);
      aThetaOffset[i] = Math.random() * Math.PI * 2;
      aRadiusBase[i] = Math.random();
      aSpeedVar[i] = 0.6 + Math.random() * 0.8;
      aPatternSlot[i] = Math.random();
    }

    geo.setAttribute("position", new THREE.BufferAttribute(position3, 3));
    geo.setAttribute("aIndex", new THREE.BufferAttribute(aIndex, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    geo.setAttribute("aPhi", new THREE.BufferAttribute(aPhi, 1));
    geo.setAttribute("aThetaOffset", new THREE.BufferAttribute(aThetaOffset, 1));
    geo.setAttribute("aRadiusBase", new THREE.BufferAttribute(aRadiusBase, 1));
    geo.setAttribute("aSpeedVar", new THREE.BufferAttribute(aSpeedVar, 1));
    geo.setAttribute("aBehavior", new THREE.BufferAttribute(aBehavior, 1));
    geo.setAttribute("aBirth", new THREE.BufferAttribute(aBirth, 1));
    geo.setAttribute("aStart", new THREE.BufferAttribute(aStart, 3));
    geo.setAttribute("aPatternSlot", new THREE.BufferAttribute(aPatternSlot, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
    return geo;
  }, []);

  const smoothed = useRef({
    activeCount: 90,
    spread: 1.6,
    stageT: 0,
    energy: 0.3,
    creativity: 0.2,
    focus: 0.2,
    connections: 0,
    seed: 0.42,
  });
  const clockTimeRef = useRef(0);
  const cursor = useRef(0);
  const lastPulse = useRef(-1);

  // Trigger handling — pulls a rotating batch of the ambient shell into a
  // meaningful behavior whenever a real interaction happens.
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state, prev) => {
      if (state.pulse === prev.pulse) return;
      if (lastPulse.current === state.pulse) return;
      lastPulse.current = state.pulse;

      const behavior = behaviorForType(state.lastInteractionType);
      const now = clockTimeRef.current;
      const spread = smoothed.current.spread;

      const aBehavior = geometry.getAttribute("aBehavior") as THREE.BufferAttribute;
      const aBirth = geometry.getAttribute("aBirth") as THREE.BufferAttribute;
      const aStart = geometry.getAttribute("aStart") as THREE.BufferAttribute;
      const aPatternSlot = geometry.getAttribute("aPatternSlot") as THREE.BufferAttribute;

      for (let b = 0; b < BATCH_SIZE; b++) {
        const idx = (cursor.current + b) % MAX_PARTICLES;
        aBehavior.setX(idx, behavior);
        aBirth.setX(idx, now);
        if (behavior === PARTICLE_BEHAVIOR.ARRIVE) {
          const far = randomFarPoint(spread * 2.6);
          aStart.setXYZ(idx, far.x, far.y, far.z);
        }
        if (behavior === PARTICLE_BEHAVIOR.ORGANIZE) {
          aPatternSlot.setX(idx, b / BATCH_SIZE);
        }
      }
      cursor.current = (cursor.current + BATCH_SIZE) % MAX_PARTICLES;

      aBehavior.needsUpdate = true;
      aBirth.needsUpdate = true;
      aStart.needsUpdate = true;
      aPatternSlot.needsUpdate = true;
    });
    return unsubscribe;
  }, [useStore, geometry]);

  useFrame((state, delta) => {
    const d = Math.min(delta, 1 / 30);
    clockTimeRef.current = state.clock.elapsedTime;

    const s = useStore.getState();
    const sm = smoothed.current;
    sm.energy = damp(sm.energy, s.energy, 3, d);
    sm.creativity = damp(sm.creativity, s.creativity, 2.2, d);
    sm.focus = damp(sm.focus, s.focus, 2.2, d);
    sm.connections = damp(sm.connections, s.connections, 2, d);
    sm.seed = damp(sm.seed, s.seed, 1.2, d);
    sm.stageT = damp(sm.stageT, s.stageT, 1.6, d);

    const target = sampleAnchor(sm.stageT);
    sm.activeCount = damp(sm.activeCount, target.particleCount, 1.4, d);
    sm.spread = damp(sm.spread, target.particleSpread, 1.4, d);

    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uActiveCount.value = sm.activeCount;
    u.uSpread.value = sm.spread;
    u.uEnergy.value = sm.energy;
    u.uCreativity.value = sm.creativity;
    u.uFocus.value = sm.focus;
    u.uConnections.value = sm.connections;
    u.uSeedGlobal.value = sm.seed;
    u.uPixelRatio.value = Math.min(state.gl.getPixelRatio(), 2);
  });

  return (
    <group position={position}>
      <points geometry={geometry} frustumCulled={false}>
        <particleMaterial ref={materialRef} attach="material" uSize={11} />
      </points>
      <ConnectionTrails
        useStore={useStore}
        spread={() => smoothed.current.spread}
      />
    </group>
  );
}
