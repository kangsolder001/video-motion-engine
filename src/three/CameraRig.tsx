import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

type Vec3 = [number, number, number];

/**
 * Kamera dikendalikan sepenuhnya dari `useCurrentFrame()` (deterministik).
 * `useFrame` TIDAK dipakai karena tidak deterministik per frame di Remotion.
 */
export const CameraRig: React.FC<{
  position: Vec3;
  target: Vec3;
  fov?: number;
}> = ({ position, target, fov = 42 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  camera.position.set(position[0], position[1], position[2]);
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  camera.up.set(0, 1, 0);
  camera.lookAt(target[0], target[1], target[2]);
  camera.updateMatrixWorld();

  return null;
};

/** Interpolasi linear + easing antara dua keyframe kamera. */
export const lerp3 = (a: Vec3, b: Vec3, p: number): Vec3 => [
  a[0] + (b[0] - a[0]) * p,
  a[1] + (b[1] - a[1]) * p,
  a[2] + (b[2] - a[2]) * p,
];

/** Easing cubic-out: cepat di awal, melambat di akhir — terasa "cinematic". */
export const easeOutCubic = (p: number): number => 1 - Math.pow(1 - p, 3);
export const easeInOutCubic = (p: number): number =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
export const easeOutBack = (p: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

/** Nilai yang "naik lalu turun" — dipakai untuk pulse. */
export const pulse = (t: number, speed = 1): number =>
  0.5 + 0.5 * Math.sin(t * speed * Math.PI * 2);

export const useCameraShakeSeed = () => useMemo(() => Math.random(), []);
