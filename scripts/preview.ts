#!/usr/bin/env node
/**
 * Render 1 gambar per scene (tengah scene) untuk cek visual cepat, tanpa render penuh.
 * Usage: npm run preview -- EP002   -> out/EP002-preview/SC01.png, SC02.png, ...
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEpisode, type Timing } from "../src/engine/schema.ts";
import { FPS, buildTimeline } from "../src/engine/timeline.ts";

const id = process.argv[2];
if (!id || !/^EP\d{3}$/.test(id)) {
  console.error("Usage: npm run preview -- EP001");
  process.exit(1);
}
const ROOT = path.resolve(import.meta.dirname, "..");
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: "inherit", cwd: ROOT });

run("node", ["scripts/validate.ts", id]);
const dir = path.join(ROOT, "episodes", id);
if (!existsSync(path.join(dir, "timing.json"))) run("node", ["scripts/tts.mjs", id]);

const r = parseEpisode(JSON.parse(readFileSync(path.join(dir, "episode.json"), "utf8")));
if (!r.ok) process.exit(1);
const tl = buildTimeline(r.episode, JSON.parse(readFileSync(path.join(dir, "timing.json"), "utf8")) as Timing);

const out = path.join(ROOT, "out", `${id}-preview`);
mkdirSync(out, { recursive: true });
for (const s of tl.scenes) {
  // Scene dengan beat (objek ber-`show`) dicek di 3 titik, lainnya cukup di tengah
  const beats = s.objects.some((o) => o.show) || s.labels.some((l) => l.show);
  const points = beats ? [0.2, 0.5, 0.85] : [0.5];
  points.forEach((p, i) => {
    const frame = Math.round((s.start + s.duration * p) * FPS);
    const file = path.join(out, beats ? `${s.id}-${i + 1}.png` : `${s.id}.png`);
    run("npx", ["remotion", "still", id, file, `--frame=${frame}`, "--scale=0.4", "--log=error"]);
    console.log(`${s.id}  frame ${frame}  (progres ${p})  -> ${path.relative(ROOT, file)}`);
  });
}
