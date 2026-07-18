import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import * as THREE from "three";
import { ArtifactStoreHook, useArtifactStore } from "@/store/useArtifactStore";
import { clamp, damp } from "@/lib/math";

const SLOT_COUNT = 4;
const RUN_DURATION = 1.7;

interface TrailBusEntry {
  version: number;
  start: THREE.Vector3;
  end: THREE.Vector3;
}

function randomOnSphere(radius: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi) * 0.7,
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function quadBezier(
  out: THREE.Vector3,
  a: THREE.Vector3,
  c: THREE.Vector3,
  b: THREE.Vector3,
  t: number
) {
  const it = 1 - t;
  out.set(
    it * it * a.x + 2 * it * t * c.x + t * t * b.x,
    it * it * a.y + 2 * it * t * c.y + t * t * b.y,
    it * it * a.z + 2 * it * t * c.z + t * t * b.z
  );
  return out;
}

function TrailRunner({
  entry,
}: {
  entry: React.MutableRefObject<TrailBusEntry>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastVersion = useRef(0);
  const bornAt = useRef(-100);
  const control = useRef(new THREE.Vector3());
  const start = useRef(new THREE.Vector3());
  const end = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const e = entry.current;
    const now = state.clock.elapsedTime;

    if (e.version !== lastVersion.current) {
      lastVersion.current = e.version;
      start.current.copy(e.start);
      end.current.copy(e.end);
      control.current
        .copy(start.current)
        .add(end.current)
        .multiplyScalar(0.5 * 0.12);
      bornAt.current = now;
      mesh.position.copy(start.current);
    }

    const age = now - bornAt.current;
    if (age >= 0 && age <= RUN_DURATION) {
      const t = clamp(age / RUN_DURATION, 0, 1);
      const eased = 1 - Math.pow(1 - t, 2.2);
      quadBezier(mesh.position, start.current, control.current, end.current, eased);
    } else {
      // Settle back toward the artifact core — the connection's energy
      // folds back into the artifact rather than just vanishing.
      mesh.position.x = damp(mesh.position.x, 0, 2.4, delta);
      mesh.position.y = damp(mesh.position.y, 0, 2.4, delta);
      mesh.position.z = damp(mesh.position.z, 0, 2.4, delta);
    }
  });

  return (
    <Trail width={2} length={6} decay={1.3} attenuation={(w) => w} color="#bcdcff">
      <mesh ref={meshRef} visible={false}>
        <sphereGeometry args={[0.01, 4, 4]} />
        <meshBasicMaterial />
      </mesh>
    </Trail>
  );
}

export interface ConnectionTrailsProps {
  useStore?: ArtifactStoreHook;
  /** Roughly matches ParticleField's spread so trails arc through the same
   * volume. Accepts a getter so callers can hand over a live value (e.g. a
   * ref) without forcing re-renders every frame. */
  spread?: number | (() => number);
}

/**
 * Renders the "discovering a new connection" moment: a soft glowing trail
 * arcing through the artifact's field and folding back into its core.
 * Triggered whenever a `collaboration` interaction fires.
 */
export function ConnectionTrails({
  useStore = useArtifactStore,
  spread = 2,
}: ConnectionTrailsProps) {
  const bus = useMemo<React.MutableRefObject<TrailBusEntry>[]>(
    () =>
      Array.from({ length: SLOT_COUNT }, () => ({
        current: { version: 0, start: new THREE.Vector3(), end: new THREE.Vector3() },
      })),
    []
  );
  const cursor = useRef(0);
  const lastPulse = useRef(-1);

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state, prev) => {
      if (state.pulse === prev.pulse) return;
      if (state.lastInteractionType !== "collaboration") return;
      if (lastPulse.current === state.pulse) return;
      lastPulse.current = state.pulse;

      const slot = bus[cursor.current % SLOT_COUNT];
      cursor.current += 1;

      const currentSpread = typeof spread === "function" ? spread() : spread;
      const radius = currentSpread * 1.3;
      slot.current = {
        version: slot.current.version + 1,
        start: randomOnSphere(radius),
        end: randomOnSphere(radius),
      };
    });
    return unsubscribe;
  }, [useStore, bus, spread]);

  return (
    <group>
      {bus.map((entry, i) => (
        <TrailRunner key={i} entry={entry} />
      ))}
    </group>
  );
}
