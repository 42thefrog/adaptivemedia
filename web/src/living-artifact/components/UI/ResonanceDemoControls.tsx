import type { CSSProperties, RefObject } from "react";
import type { ArtifactStoreHook } from "@/store/useArtifactStore";
import type { ArtifactProfile, InteractionInput } from "@/types";
import type { ResonanceExperienceHandle } from "../ResonanceExperience";
import { computeAffinity, affinityToTargetStrength } from "@/lib/resonance";

export interface ResonanceDemoPeer {
  id: string;
  label: string;
  useStore: ArtifactStoreHook;
}

export interface ResonanceDemoControlsProps {
  peers: ResonanceDemoPeer[];
  artifactRef: RefObject<ResonanceExperienceHandle>;
}

const INTERACTIONS: { key: keyof InteractionInput; label: string }[] = [
  { key: "youtube", label: "YouTube" },
  { key: "reddit", label: "Reddit" },
  { key: "github", label: "GitHub" },
  { key: "savedInsight", label: "Save Insight" },
  { key: "collaboration", label: "Collaborate" },
];

const PROFILES: ArtifactProfile[] = ["balanced", "developer", "designer", "founder"];

/**
 * Demo-only. Drives two (or more) independent peers so Shared Resonance can
 * actually be seen forming and fading, and shows a plain-language readout
 * of *why* — not part of the reusable Nextbound API surface.
 */
export function ResonanceDemoControls({ peers, artifactRef }: ResonanceDemoControlsProps) {
  return (
    <div style={wrapStyle}>
      {peers.map((peer, i) => (
        <PeerPanel
          key={peer.id}
          peer={peer}
          align={i === 0 ? "left" : "right"}
          artifactRef={artifactRef}
        />
      ))}
      {peers.length >= 2 && <AffinityReadout a={peers[0]} b={peers[1]} />}
    </div>
  );
}

function PeerPanel({
  peer,
  align,
  artifactRef,
}: {
  peer: ResonanceDemoPeer;
  align: "left" | "right";
  artifactRef: RefObject<ResonanceExperienceHandle>;
}) {
  const { stage, creativity, focus, connections, resonance, profile } = peer.useStore();

  return (
    <div style={{ ...panelStyle, [align]: 20 } as CSSProperties}>
      <div style={headerStyle}>
        <span style={brandStyle}>{peer.label}</span>
        <span style={stageStyle}>{stage}</span>
      </div>

      <div style={metricsRow}>
        <Metric label="Creativity" value={creativity} />
        <Metric label="Focus" value={focus} />
        <Metric label="Connections" value={connections} />
        <Metric label="Resonance" value={resonance} highlight />
      </div>

      <div style={sectionLabel}>Interactions</div>
      <div style={buttonGrid}>
        {INTERACTIONS.map(({ key, label }) => (
          <button
            key={key}
            style={pillButton}
            onClick={() => artifactRef.current?.[peer.id]?.update({ [key]: true })}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={sectionLabel}>Identity</div>
      <div style={buttonGrid}>
        {PROFILES.map((p) => (
          <button
            key={p}
            style={{
              ...pillButton,
              borderColor: p === profile ? "rgba(127,184,255,0.7)" : pillButton.borderColor,
            }}
            onClick={() => artifactRef.current?.[peer.id]?.setProfile(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function AffinityReadout({ a, b }: { a: ResonanceDemoPeer; b: ResonanceDemoPeer }) {
  const sa = a.useStore();
  const sb = b.useStore();
  const affinity = computeAffinity(
    { creativity: sa.creativity, focus: sa.focus, connections: sa.connections, profile: sa.profile, stage: sa.stage },
    { creativity: sb.creativity, focus: sb.focus, connections: sb.connections, profile: sb.profile, stage: sb.stage }
  );
  const strength = affinityToTargetStrength(affinity);
  const label =
    strength > 0.6 ? "strongly resonating" : strength > 0.15 ? "beginning to resonate" : "not yet connected";

  return (
    <div style={affinityStyle}>
      <div style={affinityBarTrack}>
        <div style={{ ...affinityBarFill, width: `${Math.round(strength * 100)}%` }} />
      </div>
      <span style={affinityLabel}>{label}</span>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div style={metricStyle}>
      <div style={metricBarTrack}>
        <div
          style={{
            ...metricBarFill,
            width: `${Math.round(value * 100)}%`,
            background: highlight
              ? "linear-gradient(90deg, #f4f7fb, #ffffff)"
              : metricBarFill.background,
          }}
        />
      </div>
      <span style={metricLabel}>{label}</span>
    </div>
  );
}

const wrapStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
};

const panelStyle: CSSProperties = {
  position: "absolute",
  top: 20,
  width: 260,
  padding: 16,
  borderRadius: 18,
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
  marginBottom: 12,
};

const brandStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "-0.01em",
};

const stageStyle: CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#a9d0ff",
};

const metricsRow: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 14,
};

const metricStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
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
  fontSize: 10.5,
  color: "rgba(244,247,251,0.65)",
  width: 76,
  textAlign: "right",
};

const sectionLabel: CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(244,247,251,0.45)",
  margin: "8px 0 6px",
};

const buttonGrid: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const pillButton: CSSProperties = {
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid rgba(244,247,251,0.16)",
  background: "rgba(244,247,251,0.05)",
  color: "#f4f7fb",
  fontSize: 11.5,
  cursor: "pointer",
};

const affinityStyle: CSSProperties = {
  position: "absolute",
  bottom: 28,
  left: "50%",
  transform: "translateX(-50%)",
  width: 280,
  padding: "12px 18px",
  borderRadius: 999,
  background: "rgba(10,14,23,0.55)",
  border: "1px solid rgba(244,247,251,0.1)",
  backdropFilter: "blur(20px)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  pointerEvents: "none",
};

const affinityBarTrack: CSSProperties = {
  height: 3,
  borderRadius: 2,
  background: "rgba(244,247,251,0.12)",
  overflow: "hidden",
};

const affinityBarFill: CSSProperties = {
  height: "100%",
  background: "linear-gradient(90deg, #7fb8ff, #ffffff)",
  transition: "width 0.5s ease",
};

const affinityLabel: CSSProperties = {
  fontSize: 11,
  textAlign: "center",
  color: "rgba(244,247,251,0.75)",
  letterSpacing: "0.02em",
};
