import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";
import { useFrame } from "@react-three/fiber";
import { Scene } from "./Scene";
import { LivingArtifact } from "./LivingArtifact/LivingArtifact";
import { ParticleField } from "./ParticleField/ParticleField";
import { FinalExperienceOverlay } from "./UI/FinalExperienceOverlay";
import { ArtifactStoreHook, useArtifactStore } from "@/store/useArtifactStore";
import type { ArtifactProfile, InteractionInput } from "@/types";

/** Drives the store's idle decay simulation once per frame. Lives inside the
 * Canvas so it shares R3F's render loop instead of a separate interval.
 * Exported so multi-artifact compositions (e.g. ResonanceExperience) can
 * reuse it per peer instead of duplicating the tick wiring. */
export function StoreTicker({ useStore }: { useStore: ArtifactStoreHook }) {
  useFrame((_, delta) => {
    useStore.getState().tick(Math.min(delta, 1 / 20));
  });
  return null;
}

/**
 * Imperative API — mirrors the spec:
 *   artifact.update({ youtube: true, reddit: true, ... })
 */
export interface LivingArtifactHandle {
  update: (input: InteractionInput) => void;
  setProfile: (profile: ArtifactProfile) => void;
  completeExperience: () => void;
  reset: () => void;
}

export interface NextboundExperienceProps {
  /** Pass a custom store (from `createArtifactStore()`) to run more than one
   * independent experience at once. Defaults to the app-wide singleton. */
  useStore?: ArtifactStoreHook;
  profile?: ArtifactProfile;
  interactive?: boolean;
  autoRotate?: boolean;
  /** Show the cinematic "Your Living Artifact has evolved" close once the
   * experience is marked complete via `ref.current.completeExperience()`. */
  showFinalOverlay?: boolean;
  onContinueExploring?: () => void;
  onSaveExperience?: () => void;
  onShareExperience?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Top-level, drop-in Nextbound experience: Scene + LivingArtifact +
 * ParticleField + the final "this belongs to you" close, wired to a single
 * store. This is the component most integrations should reach for; reach
 * for the individual pieces (`<LivingArtifact />`, `<ParticleField />`,
 * `<Scene />`) directly if you need a custom composition.
 *
 * @example
 * const artifactRef = useRef<LivingArtifactHandle>(null);
 * <NextboundExperience ref={artifactRef} profile="developer" />
 * // later, from anywhere:
 * artifactRef.current?.update({ youtube: true, savedInsight: true });
 */
export const NextboundExperience = forwardRef<
  LivingArtifactHandle,
  NextboundExperienceProps
>(function NextboundExperience(
  {
    useStore = useArtifactStore,
    profile = "balanced",
    interactive = true,
    autoRotate = false,
    showFinalOverlay = true,
    onContinueExploring,
    onSaveExperience,
    onShareExperience,
    className,
    style,
  },
  ref
) {
  useImperativeHandle(
    ref,
    () => ({
      update: (input) => useStore.getState().update(input),
      setProfile: (p) => useStore.getState().setProfile(p),
      completeExperience: () => useStore.getState().completeExperience(),
      reset: () => useStore.getState().reset(),
    }),
    [useStore]
  );

  const didSetProfile = useRef<ArtifactProfile | null>(null);
  useEffect(() => {
    if (didSetProfile.current === profile) return;
    didSetProfile.current = profile;
    useStore.getState().setProfile(profile);
  }, [profile, useStore]);

  const isComplete = useStore((s) => s.isComplete);

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
    >
      <Scene interactive={interactive} autoRotate={autoRotate}>
        <StoreTicker useStore={useStore} />
        <LivingArtifact useStore={useStore} />
        <ParticleField useStore={useStore} />
      </Scene>
      {showFinalOverlay && (
        <FinalExperienceOverlay
          visible={isComplete}
          onContinueExploring={onContinueExploring}
          onSaveExperience={onSaveExperience}
          onShareExperience={onShareExperience}
        />
      )}
    </div>
  );
});
