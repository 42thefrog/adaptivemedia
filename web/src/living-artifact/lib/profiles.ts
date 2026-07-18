import * as THREE from "three";
import type { ArtifactProfile } from "@/types";

/**
 * Adaptive Identity bias per profile. Every artifact still shares the same
 * geometry, shaders and white/blue palette family — these are *subtle*
 * multipliers layered on top, not different materials.
 */
export interface ProfileBias {
  /** 0 = fully organic noise, 1 = faceted/geometric noise shaping. */
  sharpness: number;
  /** Multiplier on rotation speed — structured profiles feel more deliberate. */
  rotationSpeed: number;
  /** How tightly particles hew to orbital rings vs. loose organic drift. */
  particleOrder: number;
  /** Fresnel rim color lean — cooler for developer, warmer-soft for founder core. */
  colorB: THREE.Color;
}

export const PROFILE_BIAS: Record<ArtifactProfile, ProfileBias> = {
  developer: {
    sharpness: 0.65,
    rotationSpeed: 1.15,
    particleOrder: 0.8,
    colorB: new THREE.Color("#6fb2ff"),
  },
  designer: {
    sharpness: 0.05,
    rotationSpeed: 0.85,
    particleOrder: 0.25,
    colorB: new THREE.Color("#9fd4ff"),
  },
  founder: {
    sharpness: 0.3,
    rotationSpeed: 1.0,
    particleOrder: 0.55,
    colorB: new THREE.Color("#8cc6ff"),
  },
  balanced: {
    sharpness: 0.2,
    rotationSpeed: 1.0,
    particleOrder: 0.5,
    colorB: new THREE.Color("#7fb8ff"),
  },
};
