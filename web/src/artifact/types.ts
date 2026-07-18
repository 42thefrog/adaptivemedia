export type Identity = "developer" | "designer" | "founder";
export type EvolutionStage = "Seed" | "Growing" | "Complex" | "Masterpiece";

export interface JourneySignals {
  youtube: boolean;
  reddit: boolean;
  github: boolean;
  savedInsight: boolean;
  collaboration: boolean;
}

export interface ArtifactTraits {
  experienceLevel: number;
  energy: number;
  connections: number;
  creativity: number;
  focus: number;
  identity: Identity;
  seed: number;
  signals: JourneySignals;
}

export interface ArtifactHandle {
  update: (signals: Partial<JourneySignals>) => void;
}
