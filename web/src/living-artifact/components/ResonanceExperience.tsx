import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  type CSSProperties,
} from "react";
import { Scene } from "./Scene";
import { LivingArtifact } from "./LivingArtifact/LivingArtifact";
import { ParticleField } from "./ParticleField/ParticleField";
import { StoreTicker, type LivingArtifactHandle } from "./NextboundExperience";
import { SharedResonanceField } from "./Resonance/SharedResonanceField";
import { createArtifactStore, type ArtifactStoreHook } from "@/store/useArtifactStore";
import type { ArtifactProfile } from "@/types";

export interface ResonancePeerConfig {
  /** Stable identifier — used as the React key and as the key into the
   * imperative handle map exposed via `ref`. */
  id: string;
  position: [number, number, number];
  profile?: ArtifactProfile;
}

/** One `LivingArtifactHandle`-shaped API per peer, keyed by peer id. */
export type ResonanceExperienceHandle = Record<string, LivingArtifactHandle>;

export interface ResonanceExperienceProps {
  /** Fixed set of artifacts to render — treated as static after mount (each
   * peer gets its own isolated store via `createArtifactStore()`, created
   * once). Add/remove peers by remounting with a different `key`. */
  peers: ResonancePeerConfig[];
  interactive?: boolean;
  autoRotate?: boolean;
  /** World-space distance beyond which two artifacts can never be "nearby". */
  detectionRadius?: number;
  connectionColor?: string;
  className?: string;
  style?: CSSProperties;
  /** Optional escape hatch: called once, after mount, with each peer's raw
   * store hook. The `ref` handle above covers actions (update/setProfile/...);
   * reach for `onReady` only if something outside this component needs to
   * *read* a peer's live state reactively (e.g. a demo panel showing
   * connection strength). Most integrations won't need this. */
  onReady?: (peers: { id: string; useStore: ArtifactStoreHook }[]) => void;
}

/**
 * Multi-artifact composition demonstrating Shared Resonance: several
 * independent Living Artifacts in one scene, each driven by its own store,
 * connected by `<SharedResonanceField />` whenever their journeys are
 * similar enough and they're close enough to "notice" each other.
 *
 * @example
 * const ref = useRef<ResonanceExperienceHandle>(null);
 * <ResonanceExperience
 *   ref={ref}
 *   peers={[
 *     { id: "you", position: [-2.2, 0, 0], profile: "developer" },
 *     { id: "peer", position: [2.2, 0, 0], profile: "developer" },
 *   ]}
 * />
 * // later:
 * ref.current?.you.update({ github: true });
 */
export const ResonanceExperience = forwardRef<
  ResonanceExperienceHandle,
  ResonanceExperienceProps
>(function ResonanceExperience(
  {
    peers,
    interactive = true,
    autoRotate = false,
    detectionRadius = 7,
    connectionColor = "#bcdcff",
    className,
    style,
    onReady,
  },
  ref
) {
  // Peers are resolved into stores once, at mount — see the `peers` prop doc.
  const resolvedPeers = useMemo(
    () => peers.map((p) => ({ ...p, useStore: createArtifactStore() })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    resolvedPeers.forEach((p) => {
      if (p.profile) p.useStore.getState().setProfile(p.profile);
    });
    onReady?.(resolvedPeers.map((p) => ({ id: p.id, useStore: p.useStore })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(
    ref,
    () => {
      const handle: ResonanceExperienceHandle = {};
      for (const p of resolvedPeers) {
        handle[p.id] = {
          update: (input) => p.useStore.getState().update(input),
          setProfile: (profile) => p.useStore.getState().setProfile(profile),
          completeExperience: () => p.useStore.getState().completeExperience(),
          reset: () => p.useStore.getState().reset(),
        };
      }
      return handle;
    },
    [resolvedPeers]
  );

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
    >
      <Scene
        interactive={interactive}
        autoRotate={autoRotate}
        cameraPosition={[0, 1.4, 10]}
        cameraFov={48}
        minDistance={5}
        maxDistance={16}
      >
        {resolvedPeers.map((p) => (
          <group key={p.id}>
            <StoreTicker useStore={p.useStore} />
            <LivingArtifact useStore={p.useStore} position={p.position} />
            <ParticleField useStore={p.useStore} position={p.position} />
          </group>
        ))}
        <SharedResonanceField
          peers={resolvedPeers.map((p) => ({
            id: p.id,
            useStore: p.useStore,
            position: p.position,
          }))}
          detectionRadius={detectionRadius}
          color={connectionColor}
        />
      </Scene>
    </div>
  );
});
