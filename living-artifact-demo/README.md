# Nextbound — Living Artifact

An interactive 3D "Living Artifact" — the adaptive visual identity of Nextbound. Built with React, TypeScript, React Three Fiber, drei and `postprocessing`. No game aesthetics, no fantasy crystals: an organic, semi-transparent glass form that breathes, drifts and slowly reshapes itself in response to what a user does.

## What's in this pass

- `<LivingArtifact />` — the organic glass mesh: procedural morphing, volumetric glow, breathing, floating, rotation, driven by five metrics (`experienceLevel`, `energy`, `connections`, `creativity`, `focus`).
- `<ParticleField />` — an orbiting particle swarm that reacts meaningfully to interactions (arrival, organizing into patterns, flowing into the core, glowing connection trails). No fireworks, no random bursts.
- **Evolution engine** — Seed → Growing → Complex → Masterpiece, driven by one continuous scalar so nothing pops between stages.
- **Imperative API** — `artifact.update({ youtube: true, reddit: true, ... })`.
- **Uniqueness** — two users with identical interaction types still diverge, because order and timing are folded into the artifact's seed and metrics (see `src/lib/hash.ts` and `src/lib/metrics.ts`).
- **Adaptive Identity (subtle)** — a `profile` prop (`developer` / `designer` / `founder` / `balanced`) biases sharpness, rotation and particle order without changing the shared visual language. See `src/lib/profiles.ts`.
- **Shared Resonance** — nearby artifacts with similar journeys quietly notice each other, connect with a soft glowing thread, and both subtly react — no avatars, no identity beyond the artifacts themselves. See `<SharedResonanceField />` and the dedicated section below.
- **Final Experience** — a quiet, cinematic close (`<FinalExperienceOverlay />`) with Continue / Save / Share, while the artifact keeps breathing underneath.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173 — toggle "Living Artifact" / "Shared Resonance" bottom-right
npm run typecheck
npm run build
```

## Integrating into an existing app

The whole system is a drop-in component:

```tsx
import { useRef } from "react";
import {
  NextboundExperience,
  type LivingArtifactHandle,
} from "nextbound-living-artifact/src/components/NextboundExperience";

function MyPage() {
  const artifactRef = useRef<LivingArtifactHandle>(null);

  return (
    <div style={{ width: "100%", height: 600 }}>
      <NextboundExperience
        ref={artifactRef}
        profile="developer"
        onSaveExperience={() => saveToBackend()}
      />
      <button onClick={() => artifactRef.current?.update({ youtube: true })}>
        Simulate watching a video
      </button>
    </div>
  );
}
```

For multiple simultaneous artifacts (Shared Resonance), use `<ResonanceExperience />` instead:

```tsx
import { useRef } from "react";
import {
  ResonanceExperience,
  type ResonanceExperienceHandle,
} from "nextbound-living-artifact/src/components/ResonanceExperience";

function MyPage() {
  const ref = useRef<ResonanceExperienceHandle>(null);

  return (
    <div style={{ width: "100%", height: 600 }}>
      <ResonanceExperience
        ref={ref}
        peers={[
          { id: "you", position: [-2.2, 0, 0], profile: "developer" },
          { id: "peer", position: [2.2, 0, 0], profile: "developer" },
        ]}
      />
      <button onClick={() => ref.current?.you.update({ github: true })}>
        Simulate browsing GitHub
      </button>
    </div>
  );
}
```

Copy `src/` into your app (or `npm link` this package) — everything is plain TypeScript + R3F, no bundler-specific tricks beyond the `@/` path alias (mirror it in your own `tsconfig`/bundler config, or replace the `@/...` imports with relative paths).

## Architecture

```
src/
  types.ts                    Shared types (ArtifactState, InteractionInput, ...)
  store/useArtifactStore.ts   Zustand store — single source of truth, factory + singleton
  lib/
    metrics.ts                 Interaction history → the 5 metrics (order/timing sensitive)
    evolution.ts                Stage thresholds + continuous stage interpolation (no pops)
    hash.ts                     History → deterministic per-artifact seed (uniqueness)
    profiles.ts                 Adaptive Identity bias per profile
    resonance.ts                 Affinity scoring + connection-strength smoothing
    math.ts                     lerp / damp helpers (frame-rate independent smoothing)
  shaders/
    noiseGLSL.ts                 Shared simplex noise + fbm (fractional octaves)
    artifactShader.ts            LivingArtifact vertex/fragment shaders (incl. resonance glow)
    particleShader.ts            ParticleField vertex/fragment shaders + behavior codes
  components/
    LivingArtifact/               The core mesh + its ShaderMaterial
    ParticleField/                 Ambient orbit shell + ConnectionTrails (drei <Trail>)
    Resonance/                      ConnectionLine + SharedResonanceField (cross-artifact)
    UI/                             FinalExperienceOverlay, DemoControls (demo only)
    Scene.tsx                       Canvas, lighting, bloom/vignette, adaptive DPR
    NextboundExperience.tsx        Single-artifact top-level component + imperative ref API
    ResonanceExperience.tsx        Multi-artifact top-level component + Shared Resonance
  App.tsx                        Demo harness (toggles between the two)
```

### Why a Zustand store instead of props

`<LivingArtifact />` and `<ParticleField />` both read the same store independently, so they never fall out of sync and there's no prop-drilling from wherever `artifact.update(...)` gets called. `createArtifactStore()` is exposed as a factory specifically so a multi-artifact view can instantiate isolated stores — `<ResonanceExperience />` calls it once per peer, and `<SharedResonanceField />` reads across all of them without any of the artifacts knowing the others exist.

### Why nothing ever "pops"

Every value the shaders read (`energy`, `creativity`, `focus`, stage anchors for light/glow/particle density) is smoothed every frame with a frame-rate-independent exponential damp (`src/lib/math.ts`), *inside* the R3F component, not in the store. That means the store can jump instantly on `update()` — which is correct, an interaction did just happen — while everything on screen still eases toward the new target. The one exception is icosahedron subdivision (an integer, can't be interpolated); it's masked by a short "growth pulse" scale animation rather than crossfading geometry.

### Why the particle field is one shader, not a particle system per effect

A single `THREE.Points` cloud is allocated at the Masterpiece particle count (640) up front. Growth in particle density (Seed → Masterpiece) is a soft alpha fade-in driven by an `uActiveCount` uniform compared against each particle's static index — no buffer reallocation, no pop, cheap on mobile GPUs. Specific interactions (`youtube`, `reddit`, `savedInsight`, ...) don't spawn new particles; they briefly reassign a small rotating batch of the *same* particles into a different GPU-side trajectory (arrive / organize / flow-to-core), then let them ease back into the ambient orbit. "Discovering a connection" is the one exception with dedicated geometry — it uses drei's `<Trail>` for a genuinely glowing arc, since a point sprite can't read as a "trail" on its own.

## The metrics, and why they can't be gamed by content alone

`src/lib/metrics.ts` derives `experienceLevel`, `energy`, `connections`, `creativity` and `focus` from the *sequence* of interaction events, not just which types occurred:

- `creativity` leans on how irregular the timing between events is (steady clockwork reading vs. bursty, exploratory sessions look different).
- `focus` is the inverse — structured sources (`github`, `reddit`) plus steady pacing raise it.
- `connections` weights `collaboration` heavily over raw source count.
- The artifact's shader seed (`src/lib/hash.ts`) hashes each event's type *and* its position/timing in the sequence, so replaying the same interaction types in a different order produces a different seed and therefore a visibly different noise field.

Two users who "did the same things" will still end up with differently shaped artifacts if they did them in a different order, pace, or mix.

## Shared Resonance

Every artifact still lives entirely on its own — Shared Resonance is a thin layer that reads several artifacts' stores and decides, each frame, whether to draw a connection between two of them. No user identity is ever rendered; the *only* representation of a relationship is how two artifacts' light behaves toward each other.

1. **Detect** — `SharedResonanceField` checks every pair of peers each frame: are they within `detectionRadius`, and does `computeAffinity()` (`src/lib/resonance.ts`) score their current `creativity` / `focus` / `connections` / `profile` / `stage` as similar? Affinity is about the *shape* of a journey, not shared content — two users who consumed nothing in common but both ended up exploratory and broadly connected will still resonate.
2. **Form / fade** — affinity is run through a smoothstep response curve (`affinityToTargetStrength`) so borderline pairs don't flicker, then eased toward with `stepConnectionStrength`, which rises slower than it falls — connections "slowly detect each other" but let go promptly and visibly once two journeys diverge, so a fade reads as a real event.
3. **Render** — while strength is above a small threshold, `<ConnectionLine />` draws a soft glowing tube (a `QuadraticBezierCurve3` bowed slightly upward, not a straight rod) between the two artifacts, with two bands of light drifting in opposite directions along it — energy visibly flowing both ways, not a one-way signal.
4. **React** — both connected artifacts get `receiveResonance(strength, delta)` called on their store every frame: a warm-white shimmer layered into the artifact's own shader (`uResonance`, distinct from its normal energy glow) plus a small, bounded lift to `energy`/`connections`. The relationship visibly touches both sides without ever dominating either artifact's own growth.

Try it in the demo (`npm run dev` → "Shared Resonance"): set both panels to the same Adaptive Identity profile and fire the same interactions on each side to watch a connection form; then diverge one side (different profile, opposite interactions) and watch it fade on its own.

## Performance

- GPU-driven displacement and particle motion (GLSL simplex noise + fbm) — no CPU-side per-vertex work per frame.
- Single draw call for the entire particle field regardless of stage.
- `PerformanceMonitor` + `AdaptiveDpr` (drei) quietly lower render resolution under sustained frame drops instead of hard device detection.
- `antialias: false` + postprocessing bloom (which does its own soft edges) keeps the GPU budget mobile-friendly; `EffectComposer multisampling={0}`.
- No physics engine — all motion is closed-form (noise fields, damped interpolation, eased trajectories).

## Extending

- **More than 2 peers / a real "nearby users" feed**: `<ResonanceExperience peers={...} />` and `<SharedResonanceField peers={...} />` already accept an arbitrary-length array — `SharedResonanceField` connects every pair, not just the first two. Swap the static `peers` config for positions/profiles streamed from a backend and it keeps working unchanged.
- **More interaction sources**: `InteractionInput` has an index signature — any new boolean key works with `artifact.update()` immediately; add a case to `behaviorForType` in `ParticleField.tsx` to give it a distinct particle behavior (defaults to "arrive" otherwise).
- **Persistence**: `useArtifactStore.getState().history` is the full, replayable interaction log — serialize it to reconstruct an artifact's exact seed and metrics later.
- **Tuning resonance sensitivity**: `computeAffinity`'s weighting (closeness vs. profile match vs. stage match) and `affinityToTargetStrength`'s floor/ceiling are the two places to adjust how easily artifacts connect, independent of the visual/render side.
