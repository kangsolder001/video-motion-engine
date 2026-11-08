#!/usr/bin/env node
/**
 * QC subtitle: menampilkan semua celah (gap) antar potongan subtitle
 * dan periode tanpa subtitle aktif — untuk memastikan tidak ada "kekosongan"
 * yang membuat subtitle menghilang di tengah narasi.
 *
 * Usage: node scripts/check-subtitles.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ep = JSON.parse(readFileSync(path.join(ROOT, "src/episode/episode.json"), "utf8"));
const dur = JSON.parse(readFileSync(path.join(ROOT, "src/episode/audio-durations.json"), "utf8"));
const wordsRaw = JSON.parse(readFileSync(path.join(ROOT, "src/episode/words.json"), "utf8"));

const GAP = 0.2; // harus sama dengan timeline.ts

// Rebuild SEGMENTS
let cursor = 0;
const segments = ep.narration.map((seg) => {
  const start = cursor;
  const end = start + dur[seg.id];
  cursor = end + GAP;
  return {
    id: seg.id,
    start,
    end,
    words: (wordsRaw[seg.id] ?? []).map((w) => ({
      part: w.part.trim(),
      start: start + w.start / 1000,
      end: start + w.end / 1000,
    })),
  };
});

// Rebuild SUBTITLES (MAX_WORDS=7, PAUSE=0.35) — tiruan persis timeline.ts
const all = [];
for (const seg of segments) for (const w of seg.words) if (w.part) all.push(w);
all.sort((a, b) => a.start - b.start);

const chunks = [];
let cur = [];
const MAX_WORDS = 7;
const PAUSE = 0.35;
const flush = () => {
  if (cur.length === 0) return;
  chunks.push({ text: cur.map((w) => w.part).join(" "), start: cur[0].start, end: cur[cur.length - 1].end });
  cur = [];
};
for (let i = 0; i < all.length; i++) {
  const w = all[i];
  if (cur.length > 0) {
    const prev = cur[cur.length - 1];
    const pause = w.start - prev.end;
    const sentenceEnd = /[.!?]$/.test(prev.part);
    if (cur.length >= MAX_WORDS || pause > PAUSE || sentenceEnd) flush();
  }
  cur.push(w);
}
flush();

// Window subtitleAt: [start-0.02, end+0.12]
const WIN_A = 0.02;
const WIN_B = 0.12;

const visible = (t) => chunks.some((c) => t >= c.start - WIN_A && t <= c.end + WIN_B);

// Cari celah (periode ≥0.05s tanpa subtitle) di dalam rentang narasi
const total = segments[segments.length - 1].end;
const gaps = [];
let runStart = null;
for (let f = 0; f < Math.ceil(total * 100); f++) {
  const t = f / 100;
  if (!visible(t)) {
    if (runStart === null) runStart = t;
  } else if (runStart !== null) {
    if (t - runStart >= 0.05) gaps.push([runStart, t]);
    runStart = null;
  }
}
if (runStart !== null) gaps.push([runStart, total]);

console.log("=== SUBTITLE GAP REPORT ===");
console.log(`total duration : ${total.toFixed(2)}s`);
console.log(`chunks         : ${chunks.length}`);
console.log(`gaps >= 0.05s  : ${gaps.length}`);
for (const [a, b] of gaps) {
  console.log(`  ${a.toFixed(2)}s -> ${b.toFixed(2)}s   (${(b - a).toFixed(2)}s)`);
}
