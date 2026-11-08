/**
 * Model 3D dari library aset (assets/library.json -> public/assets/*.glb).
 * - Ukuran dinormalisasi otomatis: sisi terpanjang = `size`, alas di y=0.
 * - style "hologram" mengganti material asli dengan warna tema agar
 *   model dari sumber mana pun tampak satu gaya dengan engine.
 * - Animasi bawaan model diputar lewat mixer.setTime(t): deterministik per frame.
 */
import { useEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import library from "../../assets/library.json";
import { Glow } from "../three/glow";

type Vec3 = [number, number, number];
type LibraryEntry = { id: string; file: string };

const urlOf = (asset: string) => {
  const entry = (library.assets as LibraryEntry[]).find((a) => a.id === asset);
  if (!entry) throw new Error(`Aset "${asset}" tidak ada di assets/library.json — jalankan: npm run asset:add`);
  return staticFile(`assets/${entry.file}`);
};

const loaded = new Map<string, GLTF>();

/**
 * Muat semua model episode SEBELUM ThreeCanvas dipasang: ThreeCanvas Remotion
 * tidak menggambar ulang saat state di dalamnya berubah, jadi model yang selesai
 * dimuat belakangan tidak akan pernah tampil.
 */
export const useModelsReady = (assets: string[]): boolean => {
  const key = [...new Set(assets)].sort().join(",");
  const [ready, setReady] = useState(() => assets.every((a) => loaded.has(urlOf(a))));
  const [handle] = useState(() => (ready ? null : delayRender(`memuat model: ${key}`)));
  useEffect(() => {
    if (handle === null) return;
    const urls = key ? key.split(",").map(urlOf) : [];
    Promise.all(urls.map((u) => new GLTFLoader().loadAsync(u).then((g) => loaded.set(u, g))))
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => cancelRender(new Error(`Gagal memuat model (${key}): ${e}`)));
  }, [key, handle]);
  return ready;
};

export const Model: React.FC<{
  asset: string;
  position: Vec3;
  size: number;
  rotationY: number;
  spin: number;
  bob: number;
  style: "hologram" | "original";
  color: string;
  animation: string | null;
  t: number;
}> = ({ asset, position, size, rotationY, spin, bob, style, color, animation, t }) => {
  const gltf = loaded.get(urlOf(asset));

  const prepared = useMemo(() => {
    if (!gltf) return null;
    const root = cloneSkinned(gltf.scene);
    // Bounding sphere skinned mesh tidak ikut skala/animasi -> sering ter-cull keliru
    root.traverse((o) => {
      o.frustumCulled = false;
    });

    // Normalisasi ukuran & posisi (pakai pose diam)
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const dim = box.getSize(new THREE.Vector3());
    const k = size / Math.max(dim.x, dim.y, dim.z, 1e-6);
    const center = box.getCenter(new THREE.Vector3());
    const wrapper = new THREE.Group();
    root.position.set(-center.x, -box.min.y, -center.z);
    wrapper.add(root);
    wrapper.scale.setScalar(k);

    if (style === "hologram") {
      const solid = new THREE.MeshStandardMaterial({
        color: "#0d2338",
        emissive: color,
        emissiveIntensity: 0.6,
        metalness: 0.6,
        roughness: 0.3,
      });
      const wire = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.35 });
      // Kumpulkan dulu: menambah child saat traverse membuat loop tak berujung
      const meshes: THREE.Mesh[] = [];
      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
      });
      meshes.forEach((m) => {
        m.material = solid;
        // Wireframe hasil clone tidak ikut ter-skin dengan benar -> artefak; lewati untuk mesh beranimasi
        if ((m as THREE.SkinnedMesh).isSkinnedMesh) return;
        const w = m.clone(false);
        w.material = wire;
        w.scale.multiplyScalar(1.01);
        if (m.parent) m.parent.add(w);
        w.position.copy(m.position);
        w.quaternion.copy(m.quaternion);
      });
    }

    const clips = gltf.animations;
    const clip = animation === null ? null : (clips.find((c) => c.name === animation) ?? clips[0] ?? null);
    const mixer = clip ? new THREE.AnimationMixer(root) : null;
    if (mixer && clip) mixer.clipAction(clip).play();
    return { wrapper, mixer, duration: clip?.duration ?? 0, height: dim.y * k };
  }, [gltf, size, style, color, animation]);

  if (!prepared) return null;
  if (prepared.mixer && prepared.duration > 0) prepared.mixer.setTime(t % prepared.duration);

  const y = position[1] + (bob > 0 ? Math.sin(t * 1.4) * bob : 0);
  return (
    <group position={[position[0], y, position[2]]} rotation-y={((rotationY + spin * t) * Math.PI) / 180}>
      <primitive object={prepared.wrapper} />
      {style === "hologram" ? (
        <Glow position={[0, prepared.height / 2, 0]} scale={size * 2.6} color={color} opacity={0.3} />
      ) : null}
    </group>
  );
};
