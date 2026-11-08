/**
 * Schema episode — satu-satunya kontrak antara penulis (AI apa pun) dan engine.
 *
 * Pembagian kerja:
 *  - Claude    : id, title, narration[], scenes[].{id,name,purpose,headline,subline,motion}
 *  - AI murah  : theme, scenes[].{camera, objects, labels}
 *  - Engine    : semua render, timing, subtitle, transisi.
 *
 * File ini dipakai oleh Remotion (validasi saat load) DAN oleh
 * `npm run validate` (Node type-stripping) — jangan impor apa pun selain zod.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Tipe dasar
// ---------------------------------------------------------------------------
const vec3 = z.tuple([z.number(), z.number(), z.number()]);
const range = z
  .tuple([z.number().min(0).max(1), z.number().min(0).max(1)])
  .refine(([a, b]) => a < b, "angka pertama harus < angka kedua");

/** Nama warna tema, atau hex "#RRGGBB". */
const color = z.union([
  z.enum(["primary", "secondary", "text", "surface", "background"]),
  z.string().regex(/^#[0-9a-fA-F]{6}$/, 'warna: nama tema atau hex "#RRGGBB"'),
]);

export const THEME_DEFAULTS = {
  background: "#07111F",
  surface: "#102A43",
  primary: "#00C8FF",
  secondary: "#3D83FF",
  text: "#EAF4FF",
  gridLine: "#1f7ba8",
  gridLineFaint: "#114263",
  floor: "#060f1c",
  brand: "TECHNOLOGY EXPLAINED",
};

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const ThemeSchema = z
  .object({
    background: hex.default(THEME_DEFAULTS.background),
    surface: hex.default(THEME_DEFAULTS.surface),
    primary: hex.default(THEME_DEFAULTS.primary),
    secondary: hex.default(THEME_DEFAULTS.secondary),
    text: hex.default(THEME_DEFAULTS.text),
    gridLine: hex.default(THEME_DEFAULTS.gridLine),
    gridLineFaint: hex.default(THEME_DEFAULTS.gridLineFaint),
    floor: hex.default(THEME_DEFAULTS.floor),
    brand: z.string().default(THEME_DEFAULTS.brand),
  })
  .strict();

// ---------------------------------------------------------------------------
// Field yang berlaku untuk semua objek
// ---------------------------------------------------------------------------
const common = {
  /** Jendela tampil dalam progres scene 0..1 (masuk/keluar dengan animasi). */
  show: range.optional(),
  /** Geser seluruh objek. */
  at: vec3.optional(),
  /** Denyut skala halus. */
  pulse: z
    .object({ amount: z.number().min(0).max(0.5).default(0.05), speed: z.number().min(0).max(5).default(1) })
    .strict()
    .optional(),
};

const flow = z.enum(["fast", "slow", "jammed", "lossy"]);
const direction = z.enum(["away", "toward"]);

// ---------------------------------------------------------------------------
// RECIPES — adegan siap pakai, kualitas dijamin. Pilih ini lebih dulu.
// ---------------------------------------------------------------------------
const recipes = [
  z
    .object({
      type: z.literal("jam"),
      ...common,
      /** Jumlah paket yang mengantre di belakang file besar. */
      queue: z.number().int().min(3).max(20).default(11),
      color: color.default("primary"),
      escapeColor: color.default("secondary"),
    })
    .strict()
    .describe("Hook: satu benda besar macet di jalur sempit, antrean menumpuk di belakangnya."),

  z
    .object({
      type: z.literal("lanes"),
      ...common,
      length: z.number().min(30).max(250).default(100),
      gap: z.number().min(1).max(20).default(6),
      lanes: z
        .array(
          z
            .object({
              width: z.number().min(1).max(14).default(4),
              flow: flow.default("fast"),
              direction: direction.default("away"),
              color: color.default("primary"),
              /** Panah di atas jalur: up = upload, down = download. */
              arrow: z.enum(["up", "down", "none"]).default("none"),
            })
            .strict(),
        )
        .min(1)
        .max(4)
        .describe("tiap item: {width 1–14, flow fast/slow/jammed/lossy, direction away/toward, color, arrow up/down/none}"),
    })
    .strict()
    .describe(
      "Perbandingan 1–4 jalur data berdampingan. flow: fast=lancar, slow=pelan, jammed=menumpuk, lossy=paket hilang.",
    ),

  z
    .object({
      type: z.literal("squeeze"),
      ...common,
      wideColor: color.default("secondary"),
      narrowColor: color.default("primary"),
    })
    .strict()
    .describe("Dua pipa: satu lebar mengalir deras, satu menyempit dan alirannya melambat (bandwidth / bottleneck)."),

  z
    .object({
      type: z.literal("roundtrip"),
      ...common,
      distance: z.number().min(6).max(30).default(14),
      /** Detik per satu perjalanan bolak-balik. */
      period: z.number().min(0.6).max(6).default(1.6),
      leftColor: color.default("secondary"),
      rightColor: color.default("primary"),
    })
    .strict()
    .describe("Dua node, satu paket bolak-balik di antaranya + cincin ACK (latency, request/response, ping)."),

  z
    .object({
      type: z.literal("loss"),
      ...common,
      color: color.default("primary"),
      retryColor: color.default("secondary"),
    })
    .strict()
    .describe("Deretan paket, satu menguap di tengah jalan lalu sekumpulan paket dikirim ulang (packet loss, retry)."),

  z
    .object({
      type: z.literal("hub"),
      ...common,
      spokes: z.number().int().min(2).max(8).default(5),
      radius: z.number().min(8).max(30).default(16),
      /** in = semua ke pusat, out = pusat ke semua, both = dua arah. */
      traffic: z.enum(["in", "out", "both"]).default("both"),
      hubColor: color.default("primary"),
      spokeColor: color.default("secondary"),
    })
    .strict()
    .describe("Satu node pusat (server/router/cloud) terhubung ke banyak node (client/perangkat IoT), paket mengalir di jari-jari."),

  z
    .object({
      type: z.literal("stack"),
      ...common,
      layers: z.number().int().min(2).max(7).default(4),
      /** true = lapisan muncul satu per satu sepanjang scene. */
      reveal: z.boolean().default(true),
      colors: z.array(color).min(1).default(["secondary", "primary"]),
    })
    .strict()
    .describe("Tumpukan lapisan (arsitektur berlapis, OSI, stack teknologi). Beri nama lapisan lewat `labels`."),

  z
    .object({
      type: z.literal("horizon"),
      ...common,
      color: color.default("primary"),
    })
    .strict()
    .describe("Closing: jalur membentang ke horizon, gelombang sinyal menjauh, partikel naik. Pasangkan dengan kamera pull-out."),
] as const;

// ---------------------------------------------------------------------------
// PRIMITIVES — bahan mentah untuk menambah detail. Pakai bila recipe kurang.
// ---------------------------------------------------------------------------
const primitives = [
  z
    .object({
      type: z.literal("lane"),
      ...common,
      x: z.number().default(0),
      width: z.number().min(0.5).max(30).default(4),
      length: z.number().min(5).max(300).default(90),
      color: color.default("primary"),
      opacity: z.number().min(0).max(1).default(0.13),
    })
    .strict()
    .describe("Jalur datar di lantai dengan tepi menyala."),
  z
    .object({
      type: z.literal("packets"),
      ...common,
      x: z.number().default(0),
      width: z.number().min(0.5).max(30).default(4),
      count: z.number().int().min(1).max(40).default(12),
      length: z.number().min(5).max(300).default(90),
      direction: direction.default("away"),
      /** Pecahan panjang jalur per detik (0.05 pelan, 0.4 cepat). */
      speed: z.number().min(0).max(1.5).default(0.2),
      color: color.default("primary"),
      size: z.number().min(0.3).max(4).default(1.2),
      seed: z.number().min(0).max(1).default(0),
      loss: z.number().min(0).max(1).default(0),
      glow: z.boolean().default(true),
    })
    .strict()
    .describe("Paket data (kubus menyala) mengalir di sepanjang sumbu Z."),
  z
    .object({
      type: z.literal("model"),
      ...common,
      /** id aset di assets/library.json (tambah via `npm run asset:add`). */
      asset: z.string().regex(/^[a-z0-9-]+$/, "id aset: huruf kecil, angka, tanda minus"),
      position: vec3.default([0, 0, 0]),
      /** Sisi terpanjang model setelah dinormalisasi (unit dunia). */
      size: z.number().min(0.5).max(80).default(8),
      rotationY: z.number().min(-360).max(360).default(0),
      /** Putaran terus-menerus, derajat per detik. */
      spin: z.number().min(-180).max(180).default(0),
      /** Amplitudo melayang naik-turun. */
      bob: z.number().min(0).max(5).default(0),
      /** hologram = warna tema (konsisten dengan engine), original = material asli model. */
      style: z.enum(["hologram", "original"]).default("hologram"),
      color: color.default("primary"),
      /** Nama klip animasi bawaan model; kosong = klip pertama; null = diam. */
      animation: z.string().nullable().optional(),
      moveTo: vec3.optional(),
      moveDuring: range.default([0, 1]),
    })
    .strict()
    .describe("Model 3D .glb dari library aset (dicari & diunduh oleh AI). Ukuran otomatis, gaya hologram mengikuti tema."),
  z
    .object({
      type: z.literal("block"),
      ...common,
      position: vec3.default([0, 1, 0]),
      size: vec3.default([2, 2, 2]),
      color: color.default("primary"),
      /** solid = kubus terang, hero = logam + wireframe + glow besar, ghost = transparan. */
      style: z.enum(["solid", "hero", "ghost"]).default("solid"),
      moveTo: vec3.optional(),
      moveDuring: range.default([0, 1]),
    })
    .strict()
    .describe("Balok (file, data, server rack). Opsional bergerak ke `moveTo` selama `moveDuring`."),
  z
    .object({
      type: z.literal("node"),
      ...common,
      position: vec3.default([0, 4, 0]),
      color: color.default("primary"),
      scale: z.number().min(0.2).max(5).default(1),
    })
    .strict()
    .describe("Perangkat / server / titik jaringan (ikosahedron menyala)."),
  z
    .object({
      type: z.literal("arrow"),
      ...common,
      position: vec3.default([0, 8, 0]),
      direction: z.enum(["up", "down"]).default("up"),
      color: color.default("primary"),
      scale: z.number().min(0.2).max(5).default(1),
    })
    .strict()
    .describe("Panah vertikal (upload = up, download = down)."),
  z
    .object({
      type: z.literal("ring"),
      ...common,
      position: vec3.default([0, 0.3, 0]),
      color: color.default("primary"),
      radius: z.number().min(1).max(80).default(9),
      thickness: z.number().min(0.05).max(3).default(0.35),
      /** Siklus per detik. */
      speed: z.number().min(0.05).max(3).default(0.5),
      phase: z.number().min(0).max(1).default(0),
      orientation: z.enum(["upright", "flat"]).default("upright"),
    })
    .strict()
    .describe("Cincin denyut yang melebar lalu memudar (sinyal, ping, broadcast)."),
  z
    .object({
      type: z.literal("particles"),
      ...common,
      count: z.number().int().min(5).max(120).default(40),
      area: vec3.default([120, 34, 160]),
      color: color.default("primary"),
      speed: z.number().min(0).max(3).default(0.9),
    })
    .strict()
    .describe("Partikel kecil naik perlahan — suasana."),
  z
    .object({
      type: z.literal("light"),
      ...common,
      position: vec3.default([0, 20, 10]),
      color: color.default("text"),
      intensity: z.number().min(0).max(3000).default(400),
      distance: z.number().min(10).max(500).default(150),
    })
    .strict()
    .describe("Lampu titik tambahan."),
] as const;

export const ObjectSchema = z.discriminatedUnion("type", [...recipes, ...primitives]);
export type SceneObject = z.infer<typeof ObjectSchema>;
export const RECIPE_TYPES = recipes.map((r) => r.shape.type.value);
export const PRIMITIVE_TYPES = primitives.map((r) => r.shape.type.value);

// ---------------------------------------------------------------------------
// Kamera
// ---------------------------------------------------------------------------
export const CAMERA_PRESETS = ["auto", "static", "push-in", "pull-out", "crane-up", "orbit", "top-down"] as const;

const CameraPresetSchema = z
  .object({
    preset: z.enum(CAMERA_PRESETS).default("auto"),
    /** Titik yang dilihat kamera. Default: dari recipe pertama scene. */
    focus: vec3.optional(),
    /** Jarak kamera ke focus. Default: dari recipe pertama scene. */
    distance: z.number().min(5).max(250).optional(),
  })
  .strict();

const CameraKeyframeSchema = z
  .object({
    from: vec3,
    to: vec3,
    lookFrom: vec3,
    lookTo: vec3,
  })
  .strict();

export const CameraSchema = z.union([CameraKeyframeSchema, CameraPresetSchema]);
export type Camera = z.infer<typeof CameraSchema>;

// ---------------------------------------------------------------------------
// Scene & episode
// ---------------------------------------------------------------------------
export const LabelSchema = z
  .object({
    text: z.string().min(1).max(28),
    position: vec3,
    show: range.optional(),
    color: color.default("text"),
  })
  .strict();

export const SceneSchema = z
  .object({
    // --- ditulis Claude (cerita) ---
    id: z.string().regex(/^SC\d{2}$/, 'id scene seperti "SC01"'),
    name: z.string(),
    purpose: z.string(),
    headline: z.string().max(18, "headline maks 18 karakter agar muat"),
    subline: z.string().max(60),
    motion: z.string().describe("Deskripsi visual dari Claude — panduan untuk AI yang mengisi objects."),
    // --- ditulis AI murah (visual) ---
    camera: CameraSchema.default({ preset: "auto" }),
    objects: z.array(ObjectSchema).min(1, "scene butuh minimal 1 objek (pakai recipe)"),
    labels: z.array(LabelSchema).max(6).default([]),
  })
  .strict();
export type Scene = z.infer<typeof SceneSchema>;

export const EpisodeSchema = z
  .object({
    id: z.string().regex(/^EP\d{3}$/, 'id episode seperti "EP001"'),
    title: z.string(),
    contentPillar: z.string().optional(),
    targetAudience: z.string().optional(),
    language: z.string().default("id-ID"),
    voice: z.string().default("id-ID-ArdiNeural"),
    rate: z.string().default("+15%"),
    objective: z.string().optional(),
    mainQuestion: z.string().optional(),
    keyTakeaway: z.string().optional(),
    theme: ThemeSchema.default(ThemeSchema.parse({})),
    narration: z
      .array(
        z
          .object({
            id: z.string().regex(/^n\d+$/, 'id narasi seperti "n1"'),
            scene: z.string(),
            text: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    scenes: z.array(SceneSchema).min(1),
  })
  .strict()
  .superRefine((ep, ctx) => {
    const sceneIds = new Set(ep.scenes.map((s) => s.id));
    ep.narration.forEach((n, i) => {
      if (!sceneIds.has(n.scene))
        ctx.addIssue({ code: "custom", path: ["narration", i, "scene"], message: `scene "${n.scene}" tidak ada di scenes[]` });
    });
    const used = new Set(ep.narration.map((n) => n.scene));
    ep.scenes.forEach((s, i) => {
      if (!used.has(s.id))
        ctx.addIssue({ code: "custom", path: ["scenes", i, "id"], message: `scene "${s.id}" tidak punya narasi` });
    });
  });
export type Episode = z.infer<typeof EpisodeSchema>;
export type Theme = Episode["theme"];

/** Data timing hasil `npm run tts` (ms per kata, detik per segmen). */
export type Timing = {
  durations: Record<string, number>;
  words: Record<string, { part: string; start: number; end: number }[]>;
  /** teks narasi saat audio dibuat — dipakai tts untuk mendeteksi perubahan */
  texts?: Record<string, string>;
};

/** Parse + pesan error yang bisa langsung disalin balik ke AI untuk diperbaiki. */
export const parseEpisode = (
  json: unknown,
): { ok: true; episode: Episode } | { ok: false; errors: string[] } => {
  const r = EpisodeSchema.safeParse(json);
  if (r.success) return { ok: true, episode: r.data };
  return {
    ok: false,
    errors: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
  };
};
