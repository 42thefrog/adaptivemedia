import { useRef, useState } from "react";
import {
  NextboundExperience,
  type LivingArtifactHandle,
} from "@/components/NextboundExperience";
import { DemoControls } from "@/components/UI/DemoControls";
import { SharedResonanceDemo } from "@/components/SharedResonanceDemo";

type DemoMode = "single" | "resonance";

/**
 * Demo harness for the Living Artifact system. Everything reusable lives in
 * `src/components` — this file just wires it up and adds control panels so
 * the whole thing can be exercised without a real backend.
 */
export default function App() {
  const [mode, setMode] = useState<DemoMode>("single");

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {mode === "single" ? <SingleArtifactDemo /> : <SharedResonanceDemo />}
      <ModeToggle mode={mode} onChange={setMode} />
    </div>
  );
}

function SingleArtifactDemo() {
  const artifactRef = useRef<LivingArtifactHandle>(null);

  return (
    <>
      <NextboundExperience
        ref={artifactRef}
        profile="balanced"
        onContinueExploring={() => artifactRef.current?.reset()}
        onSaveExperience={() => console.log("[Nextbound] experience saved")}
        onShareExperience={() => console.log("[Nextbound] experience shared")}
      />
      <DemoControls artifactRef={artifactRef} />
    </>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: DemoMode;
  onChange: (mode: DemoMode) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        display: "flex",
        gap: 6,
        padding: 6,
        borderRadius: 999,
        background: "rgba(10,14,23,0.55)",
        border: "1px solid rgba(244,247,251,0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      {(["single", "resonance"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid",
            borderColor: mode === m ? "rgba(127,184,255,0.7)" : "rgba(244,247,251,0.16)",
            background: mode === m ? "rgba(127,184,255,0.12)" : "rgba(244,247,251,0.04)",
            color: "#f4f7fb",
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          {m === "single" ? "Living Artifact" : "Shared Resonance"}
        </button>
      ))}
    </div>
  );
}
