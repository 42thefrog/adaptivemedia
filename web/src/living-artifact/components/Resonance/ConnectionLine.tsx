import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface ConnectionLineProps {
  a: [number, number, number];
  b: [number, number, number];
  /** 0..1 visibility, read every frame from a ref so the orchestrator can
   * update it continuously without forcing React re-renders. */
  strengthRef: React.MutableRefObject<number>;
  color?: string;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uStrength;
  uniform vec3 uColor;

  void main() {
    // Two soft bands of light traveling in opposite directions along the
    // connection — "energy gently flows across the connection" (spec),
    // rather than a static line or a one-way arrow.
    float flowA = fract(vUv.x * 3.0 - uTime * 0.32);
    float flowB = fract(vUv.x * 3.0 + uTime * 0.32 + 0.5);
    float pulseA = smoothstep(0.0, 0.16, flowA) * smoothstep(0.42, 0.16, flowA);
    float pulseB = smoothstep(0.0, 0.16, flowB) * smoothstep(0.42, 0.16, flowB);

    float thread = 0.1; // faint always-on thread so the connection reads even between pulses
    float glow = thread + pulseA * 0.85 + pulseB * 0.85;

    // Fade out right at each artifact's surface rather than terminating hard.
    float endFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);

    float alpha = glow * uStrength * endFade;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/**
 * A soft glowing thread between two Living Artifacts. Persistent geometry
 * (built once from the pair's positions), fully opacity-driven — the
 * orchestrator fades `strengthRef.current` in and out rather than
 * mounting/unmounting this component, so a connection can visibly and
 * gradually form or dissolve instead of popping.
 */
export function ConnectionLine({ a, b, strengthRef, color = "#bcdcff" }: ConnectionLineProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const start = new THREE.Vector3(a[0], a[1], a[2]);
    const end = new THREE.Vector3(b[0], b[1], b[2]);
    const mid = start.clone().lerp(end, 0.5);
    const dist = start.distanceTo(end);
    mid.y += Math.min(0.4 + dist * 0.12, 1.4); // gentle upward bow, not a straight rod
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return new THREE.TubeGeometry(curve, 48, 0.012, 6, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]);

  const materialArgs = useMemo(
    () => [
      {
        uniforms: {
          uTime: { value: 0 },
          uStrength: { value: 0 },
          uColor: { value: new THREE.Color(color) },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      },
    ],
    [color]
  );

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uStrength.value = strengthRef.current;
  });

  return (
    <mesh geometry={geometry} renderOrder={1}>
      <shaderMaterial ref={materialRef} args={materialArgs} />
    </mesh>
  );
}
