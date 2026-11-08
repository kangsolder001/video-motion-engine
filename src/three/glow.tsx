import * as THREE from "three";
import { useMemo } from "react";

/**
 * Tekstur glow radial (additive) — menggantikan postprocessing bloom.
 * Postprocessing (@react-three/postprocessing) tidak stabil di headless
 * software-GL, jadi glow dibuat sebagai sprite additive.
 */
export const useGlowTexture = (): THREE.Texture => {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2,
      );
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.2, "rgba(255,255,255,0.6)");
      g.addColorStop(0.5, "rgba(255,255,255,0.16)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);
};

export const Glow: React.FC<{
  position: [number, number, number];
  scale: number;
  color: string;
  opacity?: number;
}> = ({ position, scale, color, opacity = 0.85 }) => {
  const tex = useGlowTexture();
  return (
    <sprite position={position} scale={[scale, scale, 1]}>
      <spriteMaterial
        map={tex}
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        // Fog pada material additive membuat glow terang di kejauhan — matikan.
        fog={false}
      />
    </sprite>
  );
};
