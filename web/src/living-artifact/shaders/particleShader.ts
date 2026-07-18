import * as THREE from "three";
import { noiseGLSL } from "./noiseGLSL";

/**
 * Interaction → particle behavior codes, shared between JS (when triggering
 * an event) and GLSL (when animating it). 0 is the default ambient orbit.
 */
export const PARTICLE_BEHAVIOR = {
  AMBIENT: 0,
  ARRIVE: 1, // "blue particles arrive" — eases in from outside the field
  ORGANIZE: 2, // "particles organize into patterns" — snaps into a ring, releases
  FLOW_TO_CORE: 3, // "particles flow toward the artifact" — saved insight
  CONNECT: 4, // "discovering a connection" — ambient nudge; the visible glowing
  // trail itself is rendered separately by <ConnectionTrails />
} as const;

// Note: drei's `shaderMaterial()` wraps each of these in a `{ value }`
// uniform itself — pass plain defaults here, not pre-wrapped uniform objects.
export const particleUniforms = {
  uTime: 0,
  uActiveCount: 90,
  uSpread: 1.6,
  uEnergy: 0.3,
  uCreativity: 0.2,
  uFocus: 0.2,
  uConnections: 0,
  uSeedGlobal: 0.42,
  uSize: 10,
  uPixelRatio: 1,
  uColorA: new THREE.Color("#f4f7fb"),
  uColorB: new THREE.Color("#7fb8ff"),
};

export const particleVertexShader = /* glsl */ `
  ${noiseGLSL}

  attribute float aIndex;
  attribute float aSeed;
  attribute float aPhi;
  attribute float aThetaOffset;
  attribute float aRadiusBase;
  attribute float aSpeedVar;
  attribute float aBehavior;
  attribute float aBirth;
  attribute vec3 aStart;
  attribute float aPatternSlot;

  uniform float uTime;
  uniform float uActiveCount;
  uniform float uSpread;
  uniform float uEnergy;
  uniform float uCreativity;
  uniform float uFocus;
  uniform float uConnections;
  uniform float uSeedGlobal;
  uniform float uSize;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vTint;
  varying float vGlowBoost;

  void main() {
    float enabled = smoothstep(uActiveCount + 26.0, uActiveCount - 26.0, aIndex);

    float theta = aThetaOffset + uTime * 0.1 * aSpeedVar * (0.6 + uFocus * 0.5);
    float wob = fbm(vec3(aSeed * 12.3 + uSeedGlobal * 5.0, uTime * 0.06, aPhi * 2.0), 1.0 + uCreativity * 2.0);
    float radius = uSpread * (0.32 + aRadiusBase * 0.68)
      * (1.0 + wob * 0.16 * uCreativity)
      * (0.94 + 0.06 * sin(uTime * 0.45 + aSeed * 6.28318));

    vec3 ambientPos = vec3(
      radius * sin(aPhi) * cos(theta),
      radius * cos(aPhi) * 0.72 + sin(theta * 1.4 + aSeed * 3.1) * radius * 0.05,
      radius * sin(aPhi) * sin(theta)
    );

    float age = max(uTime - aBirth, 0.0);
    float p = clamp(age / 3.2, 0.0, 1.0);
    float envelope = sin(p * 3.14159265);

    vec3 finalPos = ambientPos;
    float glowBoost = 0.0;
    float tintBoost = 0.0;

    // ARRIVE (1): ease in from a far starting point, one-shot.
    float isArrive = step(0.5, aBehavior) * step(aBehavior, 1.5);
    float arriveEase = 1.0 - pow(1.0 - clamp(age / 1.6, 0.0, 1.0), 3.0);
    vec3 arrivePos = mix(aStart, ambientPos, arriveEase);
    float arriveMask = isArrive * step(age, 1.8);
    finalPos = mix(finalPos, arrivePos, arriveMask);
    glowBoost += arriveMask * (1.0 - arriveEase) * 0.9;

    // ORGANIZE (2): briefly snap into a rotating ring, then release.
    float isOrganize = step(1.5, aBehavior) * step(aBehavior, 2.5);
    float ringAngle = aPatternSlot * 6.28318 + uTime * 0.25;
    vec3 ringPos = vec3(cos(ringAngle), sin(uTime * 0.3 + aPatternSlot * 6.28318) * 0.12, sin(ringAngle)) * (uSpread * 0.5);
    float organizeFactor = envelope * isOrganize;
    finalPos = mix(finalPos, ringPos, organizeFactor);
    glowBoost += organizeFactor * 0.55;
    tintBoost += organizeFactor * 0.5;

    // FLOW_TO_CORE (3): pulled toward the artifact center, then released back.
    float isFlow = step(2.5, aBehavior) * step(aBehavior, 3.5);
    float flowFactor = envelope * isFlow;
    finalPos = mix(finalPos, finalPos * 0.05, flowFactor);
    glowBoost += flowFactor * 1.3;

    // CONNECT (4): ambient field leans inward, brightens — supports the
    // dedicated Trail-based connection visual with a subtle field-wide reaction.
    float isConnect = step(3.5, aBehavior) * step(aBehavior, 4.5);
    float connectFactor = envelope * isConnect;
    finalPos = mix(finalPos, finalPos * 0.84, connectFactor);
    glowBoost += connectFactor * 0.8;
    tintBoost += connectFactor * 0.6;

    vAlpha = enabled;
    vTint = clamp(0.2 + uConnections * 0.45 + tintBoost, 0.0, 1.0);
    vGlowBoost = glowBoost;

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    float size = uSize * (0.55 + aSeed * 0.9) * (1.0 + glowBoost * 0.7);
    gl_PointSize = size * uPixelRatio * (300.0 / max(-mvPosition.z, 0.001));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleFragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vAlpha;
  varying float vTint;
  varying float vGlowBoost;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    if (core <= 0.001 || vAlpha <= 0.001) discard;

    vec3 color = mix(uColorA, uColorB, vTint) * (0.7 + vGlowBoost * 0.9);
    float alpha = core * vAlpha * (0.5 + vGlowBoost * 0.4);
    gl_FragColor = vec4(color, alpha);
  }
`;
