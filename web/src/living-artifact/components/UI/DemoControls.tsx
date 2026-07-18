import type { CSSProperties, RefObject } from "react";
import { useArtifactStore } from "@/store/useArtifactStore";
import type { ArtifactProfile, InteractionInput } from "@/types";
import type { LivingArtifactHandle } from "../NextboundExperience";

export interface DemoControlsProps {
  artifactRef: RefObject<LivingArtifactHandle>;
}

const INTERACTIONS: { key: keyof InteractionInput; label: string }[] = [
  { key: "youtube", label: "Watch YouTube" },
  { key: "reddit", label: "Read Reddit" },
  { key: "github", label: "Browse GitHub" },
  { key: "savedInsight", label: "Save an Insight" },
  { key: "collaboration", label: "Discover a Connection" },
];

const PROFILES: ArtifactProfile[] = ["balanced", "developer", "designer", "founder"];

/**
 * Demo-only control panel — not part of the reusable Nextbound API surface.
 * Exercises `artifact.update(...)`, profile switching, and the final
 * "complete experience" moment so the whole system can be seen end to end.
 */
export function DemoControls({ artifactRef }: DemoControlsProps) {
  const { stage, experienceLevel, energy, connections, creativity, focus, profile, isComplete } =
    useArtifactStore();

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={brandStyle}>Nextbound</span>
        <span style={stageStyle}>{stage}</span>
      </div>

      <div style={metricsRow}>
        <Metric label="Level" value={experienceLevel} />
        <Metric label="Energy" value={energy} />
        <Metric label="Connections" value={connections} />
        <Metric label="Creativity" value={creativity} />
        <Metric label="Focus" value={focus} />
      </div>

      <div style={sectionLabel}>Interactions</div>
      <div style={buttonGrid}>
        {INTERACTIONS.map(({ key, label }) => (
          <button
            key={key}
            style={pillButton}
            onClick={() => artifactRef.current?.update({ [key]: true })}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={sectionLabel}>Adaptive Identity</div>
      <div style={buttonGrid}>
        {PROFILES.map((p) => (
          <button
            key={p}
            style={{
              ...pillButton,
              borderColor: p === profile ? "rgba(127,184,255,0.7)" : pillButton.borderColor,
            }}
            onClick={() => artifactRef.current?.setProfile(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={footerRow}>
        <button
          style={{ ...pillButton, opacity: isComplete ? 0.5 : 1 }}
          disabled={isComplete}
          onClick={() => artifactRef.current?.completeExperience()}
        >
          Complete Experience
        </button>
        <button style={pillButton} onClick={() => artifactRef.current?.reset()}>
          Reset
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={metricStyle}>
      <div style={metricBarTrack}>
        <div style={{ ...metricBarFill, width: `${Math.round(value * 100)}%` }} />
      </div>
      <span style={metricLabel}>{label}</span>
    </div>
  );
}

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 20,
  left: 20,
  right: 20,
  maxWidth: 420,
  padding: 18,
  borderRadius: 20,
  background: "rgba(10,14,23,0.55)",
  border: "1px solid rgba(244,247,251,0.1)",
  backdropFilter: "blur(20px)",
  color: "#f4f7fb",
  fontFamily: "var(--nb-font)",
  pointerEvents: "auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 14,
};

const brandStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: "-0.01em",
};

const stageStyle: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#a9d0ff",
};

const metricsRow: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 16,
};

const metricStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const metricBarTrack: CSSProperties = {
  flex: 1,
  height: 4,
  borderRadius: 2,
  background: "rgba(244,247,251,0.12)",
  overflow: "hidden",
};

const metricBarFill: CSSProperties = {
  height: "100%",
  background: "linear-gradient(90deg, #f4f7fb, #7fb8ff)",
  transition: "width 0.4s ease",
};

const metricLabel: CSSProperties = {
  fontSize: 11,
  color: "rgba(244,247,251,0.65)",
  width: 88,
  textAlign: "right",
};

const sectionLabel: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(244,247,251,0.45)",
  margin: "10px 0 8px",
};

const buttonGrid: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const pillButton: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid rgba(244,247,251,0.16)",
  background: "rgba(244,247,251,0.05)",
  color: "#f4f7fb",
  fontSize: 12.5,
  cursor: "pointer",
};

const footerRow: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 16,
};
