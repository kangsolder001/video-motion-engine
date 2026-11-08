/**
 * Kamera: keyframe eksplisit, atau preset + focus/distance.
 * Bila focus/distance kosong, diambil dari recipe pertama scene sehingga
 * AI cukup menulis `"camera": {"preset": "auto"}` (atau tidak menulis apa pun).
 */
import { CAMERA_PRESETS, RECIPE_TYPES, type Scene, type SceneObject } from "./schema.ts";
import { easeInOutCubic, lerp3 } from "../three/CameraRig";

type Vec3 = [number, number, number];
type Preset = Exclude<(typeof CAMERA_PRESETS)[number], "auto">;

/** az/el dalam derajat, dist sebagai pengali `distance`. [awal, akhir]. */
const PRESETS: Record<Preset, { az: [number, number]; el: [number, number]; d: [number, number] }> = {
  static: { az: [8, 8], el: [18, 18], d: [1, 1] },
  "push-in": { az: [14, 6], el: [12, 9], d: [1.3, 1] },
  "pull-out": { az: [0, 0], el: [12, 24], d: [1, 2.6] },
  "crane-up": { az: [0, 0], el: [7, 38], d: [1.2, 1.1] },
  orbit: { az: [-35, 35], el: [6, 12], d: [1, 1] },
  "top-down": { az: [0, 0], el: [38, 34], d: [1.1, 1] },
};

type Framing = { focus: Vec3; distance: number; preset: Preset };

/** Framing bawaan tiap recipe — diuji untuk 9:16 (FOV horizontal ~29°, setengah lebar terlihat ≈ 0.26 × jarak). */
const framingFor = (o: SceneObject | undefined): Framing => {
  switch (o?.type) {
    case "jam":
      return { focus: [0, 2.4, -6], distance: 27, preset: "push-in" };
    case "lanes": {
      const w = o.lanes.reduce((s, l) => s + l.width, 0) + o.gap * (o.lanes.length - 1);
      return o.lanes.length <= 2
        ? { focus: [0, 0, -2], distance: Math.max(45, w * 3.4), preset: "crane-up" }
        : { focus: [0, 0, -8], distance: Math.max(45, w * 2.9), preset: "top-down" };
    }
    case "squeeze":
    case "roundtrip":
      return { focus: [0, 4, 0], distance: o.type === "roundtrip" ? Math.max(48, o.distance * 4.2) : 48, preset: "orbit" };
    case "loss":
      return { focus: [0, 1.6, 0], distance: 46, preset: "orbit" };
    case "hub":
      return { focus: [0, 3, 0], distance: o.radius * 4.6, preset: "top-down" };
    case "stack":
      return { focus: [0, o.layers * 1.3, 0], distance: Math.max(42, o.layers * 10), preset: "orbit" };
    case "horizon":
      return { focus: [0, 3, -16], distance: 40, preset: "pull-out" };
    case "model":
      return { focus: [o.position[0], o.position[1] + o.size * 0.45, o.position[2]], distance: Math.max(18, o.size * 2.8), preset: "orbit" };
    default:
      return { focus: [0, 2, 0], distance: 40, preset: "push-in" };
  }
};

const RECIPES = new Set<string>(RECIPE_TYPES);

export const cameraAt = (scene: Scene, p: number): { pos: Vec3; target: Vec3 } => {
  const e = easeInOutCubic(p);
  const cam = scene.camera;
  if ("from" in cam) return { pos: lerp3(cam.from, cam.to, e), target: lerp3(cam.lookFrom, cam.lookTo, e) };

  const lead = scene.objects.find((o) => RECIPES.has(o.type)) ?? scene.objects[0];
  const f = framingFor(lead);
  const at = lead?.at ?? [0, 0, 0];
  const focus: Vec3 = cam.focus ?? [f.focus[0] + at[0], f.focus[1] + at[1], f.focus[2] + at[2]];
  const distance = cam.distance ?? f.distance;
  const k = PRESETS[cam.preset === "auto" ? f.preset : cam.preset];

  const rad = Math.PI / 180;
  const az = (k.az[0] + (k.az[1] - k.az[0]) * e) * rad;
  const el = (k.el[0] + (k.el[1] - k.el[0]) * e) * rad;
  const d = distance * (k.d[0] + (k.d[1] - k.d[0]) * e);
  return {
    pos: [focus[0] + d * Math.sin(az) * Math.cos(el), focus[1] + d * Math.sin(el), focus[2] + d * Math.cos(az) * Math.cos(el)],
    target: focus,
  };
};
