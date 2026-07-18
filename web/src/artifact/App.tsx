import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Bookmark, CircleCheck, Link2, Play, Share2 } from "lucide-react";
import { ArtifactScene } from "./Scene.js";
import { evolve, evolutionStage } from "./evolution.js";
import type { ArtifactTraits, Identity, JourneySignals } from "./types.js";

const initialSignals: JourneySignals = { youtube: true, reddit: false, github: false, savedInsight: false, collaboration: false };
const labels: Record<keyof JourneySignals, { title: string; detail: string }> = {
  youtube: { title: "Watch", detail: "Visual research" },
  reddit: { title: "Read", detail: "Emerging ideas" },
  github: { title: "Build", detail: "Open source" },
  savedInsight: { title: "Save", detail: "Insight retained" },
  collaboration: { title: "Connect", detail: "Shared resonance" },
};

export default function App() {
  const [identity, setIdentity] = useState<Identity>("designer");
  const [complete, setComplete] = useState(false);
  const [traits, setTraits] = useState<ArtifactTraits>({ experienceLevel: 0.32, energy: 0.46, connections: 0.12, creativity: 0.66, focus: 0.54, identity, seed: Math.random(), signals: initialSignals });
  const stage = evolutionStage(complete ? 1 : traits.experienceLevel);
  const displayedTraits = useMemo(() => complete ? { ...traits, experienceLevel: 1, energy: 0.82, focus: 0.9 } : traits, [complete, traits]);
  const update = useCallback((signals: Partial<JourneySignals>) => setTraits((current) => evolve(current, signals)), []);
  const chooseIdentity = (next: Identity) => { setIdentity(next); setTraits((t) => ({ ...t, identity: next })); };

  return <main className={complete ? "experience complete" : "experience"}>
    <header className="nav">
      <a className="brand" href="#" aria-label="Nextbound home"><span className="brand-symbol">N</span><span>NEXTBOUND</span></a>
      <div className="nav-meta"><span>ADAPTIVE MEDIA</span><i /><span>LIVE JOURNEY 04</span></div>
      <button className="end-button" onClick={() => setComplete(true)}><CircleCheck size={15} /> Complete</button>
    </header>
    <section className="artifact-stage">
      <div className="scene"><ArtifactScene traits={displayedTraits} quiet={complete} update={update} /></div>
      <AnimatePresence mode="wait">
        {!complete ? <motion.div className="experience-copy" key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <span className="chapter">YOUR LIVING ARTIFACT</span>
          <h1>Every choice<br />leaves a trace.</h1>
          <p>Your journey is becoming a form no one else can make.</p>
        </motion.div> : <motion.div className="completion" key="complete" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 1 }}>
          <span className="chapter">JOURNEY 04 · COMPLETE</span>
          <h1>Your Living Artifact<br />has evolved.</h1>
          <p>This experience now belongs to you.</p>
          <div className="final-actions">
            <button className="primary-action" onClick={() => setComplete(false)}>Continue Exploring <ArrowUpRight size={16} /></button>
            <button aria-label="Save experience"><Bookmark size={17} /><span>Save Experience</span></button>
            <button aria-label="Share experience"><Share2 size={17} /><span>Share Experience</span></button>
          </div>
        </motion.div>}
      </AnimatePresence>
      {!complete && <aside className="identity-panel">
        <span>ADAPTIVE IDENTITY</span>
        <div className="segments">{(["developer", "designer", "founder"] as Identity[]).map((item) => <button key={item} className={identity === item ? "active" : ""} onClick={() => chooseIdentity(item)}>{item}</button>)}</div>
        <p>{identity === "developer" ? "Structured motion · cooler geometry" : identity === "designer" ? "Fluid form · artistic asymmetry" : "Balanced form · luminous core"}</p>
      </aside>}
      <div className="stage-label"><span>EVOLUTION</span><strong>{stage}</strong><div className="stage-track"><i style={{ width: `${displayedTraits.experienceLevel * 100}%` }} /></div><small>{Math.round(displayedTraits.experienceLevel * 100)}%</small></div>
    </section>
    {!complete && <section className="journey-strip">
      <div className="journey-heading"><span>JOURNEY SIGNALS</span><p>Shape your artifact through meaningful interaction.</p></div>
      <div className="signals">{(Object.keys(labels) as (keyof JourneySignals)[]).map((key, index) => <button key={key} className={traits.signals[key] ? "signal active" : "signal"} onClick={() => update({ [key]: !traits.signals[key] })}>
        <span className="signal-index">0{index + 1}</span><i className="signal-dot">{key === "youtube" ? <Play size={10} fill="currentColor" /> : key === "savedInsight" ? <Bookmark size={11} /> : key === "collaboration" ? <Link2 size={11} /> : null}</i><strong>{labels[key].title}</strong><small>{labels[key].detail}</small>
      </button>)}</div>
    </section>}
  </main>;
}
