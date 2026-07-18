import { useRef, useState } from "react";
import {
  ResonanceExperience,
  type ResonanceExperienceHandle,
} from "./ResonanceExperience";
import {
  ResonanceDemoControls,
  type ResonanceDemoPeer,
} from "./UI/ResonanceDemoControls";

const PEERS = [
  { id: "you", position: [-2.4, 0, 0] as [number, number, number], profile: "developer" as const },
  { id: "peer", position: [2.4, 0, 0] as [number, number, number], profile: "developer" as const },
];

const LABELS: Record<string, string> = { you: "You", peer: "Nearby user" };

/**
 * Demo harness for Shared Resonance — two independent Living Artifacts,
 * each with their own store, that notice each other and connect when
 * their journeys are similar enough. Try matching both panels' profile and
 * firing the same interactions on both sides to watch a connection form;
 * diverge them and watch it fade.
 */
export function SharedResonanceDemo() {
  const experienceRef = useRef<ResonanceExperienceHandle>(null);
  const [peers, setPeers] = useState<ResonanceDemoPeer[]>([]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <ResonanceExperience
        ref={experienceRef}
        peers={PEERS}
        detectionRadius={7}
        onReady={(ready) => {
          setPeers(ready.map((p) => ({ ...p, label: LABELS[p.id] ?? p.id })));
        }}
      />
      {peers.length > 0 && (
        <ResonanceDemoControls peers={peers} artifactRef={experienceRef} />
      )}
    </div>
  );
}
