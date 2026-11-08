#!/usr/bin/env node
/**
 * QC subtitle: cari periode di dalam narasi tanpa subtitle aktif
 * (subtitle "menghilang" di tengah kalimat). Memakai timeline engine yang sama.
 *
 * Usage: npm run check:subs -- EP001
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseEpisode, type Timing } from "../src/engine/schema.ts";
import { buildTimeline } from "../src/engine/timeline.ts";

const id = process.argv[2];
if (!id) {
  console.error("Usage: npm run check:subs -- EP001");
  process.exit(1);
}
const dir = path.resolve(import.meta.dirname, "../episodes", id);
const r = parseEpisode(JSON.parse(readFileSync(path.join(dir, "episode.json"), "utf8")));
if (!r.ok) throw new Error(r.errors.join("\n"));
const timing = JSON.parse(readFileSync(path.join(dir, "timing.json"), "utf8")) as Timing;
const tl = buildTimeline(r.episode, timing);

const gaps: [number, number][] = [];
let runStart: number | null = null;
for (let f = 0; f < Math.ceil(tl.total * 100); f++) {
  const t = f / 100;
  if (!tl.subtitleAt(t)) runStart ??= t;
  else if (runStart !== null) {
    if (t - runStart >= 0.05) gaps.push([runStart, t]);
    runStart = null;
  }
}
if (runStart !== null) gaps.push([runStart, tl.total]);

console.log("=== SUBTITLE GAP REPORT ===");
console.log(`total duration : ${tl.total.toFixed(2)}s`);
console.log(`chunks         : ${tl.subtitles.length}`);
console.log(`gaps >= 0.05s  : ${gaps.length}`);
for (const [a, b] of gaps) console.log(`  ${a.toFixed(2)}s -> ${b.toFixed(2)}s   (${(b - a).toFixed(2)}s)`);
