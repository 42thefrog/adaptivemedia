import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import {
  artifactUniforms,
  artifactVertexShader,
  artifactFragmentShader,
} from "@/shaders/artifactShader";

/**
 * The Living Artifact's core "glass" material — organic morph via GPU noise,
 * fresnel-driven glassy glow, additive rim light. Built with drei's
 * shaderMaterial helper so uniforms show up as plain props in JSX and get
 * proper defaults + typing via the ArtifactMaterialImpl class below.
 */
export const ArtifactMaterialImpl = shaderMaterial(
  artifactUniforms,
  artifactVertexShader,
  artifactFragmentShader
);

ArtifactMaterialImpl.prototype.transparent = true;
ArtifactMaterialImpl.prototype.side = THREE.DoubleSide;
ArtifactMaterialImpl.prototype.depthWrite = false;
ArtifactMaterialImpl.prototype.blending = THREE.NormalBlending;

extend({ artifactMaterial: ArtifactMaterialImpl });

declare module "@react-three/fiber" {
  interface ThreeElements {
    artifactMaterial: any;
  }
}

/** Simple additive backside shell — the soft volumetric glow around the core. */
export const GlowMaterialImpl = shaderMaterial(
  {
    uTime: 0,
    uEnergy: 0.3,
    uColor: new THREE.Color("#a9d0ff"),
    uIntensity: 0.5,
  },
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  /* glsl */ `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uEnergy;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - clamp(dot(viewDir, normalize(vNormal)), 0.0, 1.0), 2.4);
      float glow = fresnel * uIntensity * (0.6 + uEnergy * 0.7);
      gl_FragColor = vec4(uColor * glow, glow);
    }
  `
);

GlowMaterialImpl.prototype.transparent = true;
GlowMaterialImpl.prototype.side = THREE.BackSide;
GlowMaterialImpl.prototype.depthWrite = false;
GlowMaterialImpl.prototype.blending = THREE.AdditiveBlending;

extend({ glowMaterial: GlowMaterialImpl });

declare module "@react-three/fiber" {
  interface ThreeElements {
    glowMaterial: any;
  }
}
