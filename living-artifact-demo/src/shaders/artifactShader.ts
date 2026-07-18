import { noiseGLSL } from "./noiseGLSL";
import * as THREE from "three";

// Note: drei's `shaderMaterial()` wraps each of these in a `{ value }`
// uniform itself — pass plain defaults here, not pre-wrapped uniform objects.
export const artifactUniforms = {
  uTime: 0,
  uSeed: 0.42,
  uEnergy: 0.3,
  uCreativity: 0.2,
  uFocus: 0.2,
  uOctaves: 1.0,
  uSharpness: 0.0, // 0 organic .. 1 geometric (Adaptive Identity hook)
  uGlow: 0.4,
  uFresnelPower: 2.1,
  // Shared Resonance: a distinct warm-white shimmer, separate from the
  // artifact's own energy glow — reads as "aware of another artifact"
  // rather than "excited about own activity".
  uResonance: 0.0,
  uColorA: new THREE.Color("#f4f7fb"),
  uColorB: new THREE.Color("#7fb8ff"),
};

export const artifactVertexShader = /* glsl */ `
  ${noiseGLSL}

  uniform float uTime;
  uniform float uSeed;
  uniform float uEnergy;
  uniform float uCreativity;
  uniform float uFocus;
  uniform float uOctaves;
  uniform float uSharpness;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  void main() {
    float t = uTime * (0.12 + uEnergy * 0.1);
    vec3 seedOffset = vec3(uSeed * 19.19, uSeed * 7.77, uSeed * 31.31);

    float structured = fbm(normal * (1.6 + uFocus * 0.8) + seedOffset + t, uOctaves);
    float organic = fbm(position * 0.85 + seedOffset * 1.3 + t * 0.6, max(1.0, uOctaves * 0.75));

    // Higher focus -> lean on the structured field (coherent, wave-like).
    // Higher creativity -> lean on the organic field (irregular, asymmetric).
    float blend = clamp(uCreativity - uFocus * 0.5 + 0.5, 0.0, 1.0);
    float displacement = mix(structured, organic, blend);

    // Sharpness (Adaptive Identity hook) trims noise softness toward faceted planes.
    displacement = mix(displacement, sign(displacement) * pow(abs(displacement), 0.6), uSharpness);

    float breathing = sin(uTime * (0.7 + uEnergy * 0.5)) * (0.03 + uEnergy * 0.02);
    float amplitude = 0.14 + uCreativity * 0.1;

    vec3 displaced = position + normal * (displacement * amplitude + breathing);

    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    vDisplacement = displacement;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const artifactFragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uGlow;
  uniform float uFresnelPower;
  uniform float uEnergy;
  uniform float uResonance;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - clamp(dot(viewDir, normal), 0.0, 1.0), uFresnelPower);

    vec3 baseColor = mix(uColorA, uColorB, clamp(vDisplacement * 0.5 + 0.5, 0.0, 1.0));
    vec3 rim = uColorB * uGlow * fresnel * (1.0 + uEnergy * 0.6);

    // A slow shimmer rather than a flat glow — a connection feels present,
    // not just "on".
    float resonancePulse = uResonance * (0.65 + 0.35 * sin(uTime * 1.8));
    vec3 resonanceGlow = vec3(1.0) * resonancePulse * (0.35 + fresnel * 0.5);

    vec3 color = baseColor * (0.28 + fresnel * 0.5) + rim + resonanceGlow;
    float alpha = clamp(0.3 + fresnel * 0.55 + uEnergy * 0.12 + resonancePulse * 0.06, 0.08, 0.95);

    gl_FragColor = vec4(color, alpha);
  }
`;
