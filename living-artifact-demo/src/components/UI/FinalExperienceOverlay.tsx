import { motion, AnimatePresence } from "framer-motion";
import type { CSSProperties } from "react";

export interface FinalExperienceOverlayProps {
  visible: boolean;
  onContinueExploring?: () => void;
  onSaveExperience?: () => void;
  onShareExperience?: () => void;
}

/**
 * The quiet, cinematic close of an experience. Deliberately sparse — one
 * line of copy, three calm actions, plenty of space around them. The canvas
 * behind this overlay keeps breathing; nothing here should read as a modal
 * blocking a "finished" screen, more like a pause.
 */
export function FinalExperienceOverlay({
  visible,
  onContinueExploring,
  onSaveExperience,
  onShareExperience,
}: FinalExperienceOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={overlayStyle}
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: "easeOut" }}
            style={titleStyle}
          >
            Your Living Artifact has evolved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9, ease: "easeOut" }}
            style={actionsStyle}
          >
            <button style={buttonStyle} onClick={onContinueExploring}>
              Continue Exploring
            </button>
            <button style={buttonStyle} onClick={onSaveExperience}>
              Save Experience
            </button>
            <button style={buttonStyle} onClick={onShareExperience}>
              Share Experience
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "0 24px 8vh",
  pointerEvents: "none",
  background:
    "linear-gradient(to top, rgba(5,7,12,0.55) 0%, rgba(5,7,12,0.0) 38%)",
};

const titleStyle: CSSProperties = {
  fontSize: "clamp(18px, 2.4vw, 26px)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  color: "var(--nb-white, #f4f7fb)",
  marginBottom: 28,
  textAlign: "center",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  justifyContent: "center",
  pointerEvents: "auto",
};

const buttonStyle: CSSProperties = {
  padding: "12px 22px",
  borderRadius: 999,
  border: "1px solid rgba(244,247,251,0.22)",
  background: "rgba(244,247,251,0.06)",
  backdropFilter: "blur(14px)",
  color: "#f4f7fb",
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: "0.01em",
  cursor: "pointer",
  transition: "background 0.25s ease, border-color 0.25s ease",
};
