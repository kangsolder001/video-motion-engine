import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

// Warna kini per episode: lihat THEME_DEFAULTS di src/engine/schema.ts

// --- Typography ---
const space = loadSpaceGrotesk("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});
const inter = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const mono = loadJetBrainsMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

export const FONTS = {
  heading: space.fontFamily,
  body: inter.fontFamily,
  mono: mono.fontFamily,
} as const;

// --- Output spec (spec.md §9.1) ---
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/** Safe area untuk subtitle / teks penting (spec.md §8.3). */
export const SAFE = {
  top: 180,
  bottom: 300,
  side: 80,
} as const;
