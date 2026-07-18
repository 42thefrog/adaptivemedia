import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import {
  particleUniforms,
  particleVertexShader,
  particleFragmentShader,
} from "@/shaders/particleShader";

export const ParticleMaterialImpl = shaderMaterial(
  particleUniforms,
  particleVertexShader,
  particleFragmentShader
);

ParticleMaterialImpl.prototype.transparent = true;
ParticleMaterialImpl.prototype.depthWrite = false;
ParticleMaterialImpl.prototype.blending = THREE.AdditiveBlending;

extend({ ParticleMaterial: ParticleMaterialImpl });

declare module "@react-three/fiber" {
  interface ThreeElements {
    particleMaterial: any;
  }
}
