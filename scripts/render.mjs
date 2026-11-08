#!/usr/bin/env node
/**
 * Render satu episode: validasi -> (tts bila timing belum ada) -> render.
 * Usage: npm run render -- EP001   -> out/EP001.mp4
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const id = process.argv[2];
if (!id || !/^EP\d{3}$/.test(id)) {
  console.error("Usage: npm run render -- EP001");
  process.exit(1);
}
const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });
run("node", ["scripts/validate.ts", id]);
if (!existsSync(`episodes/${id}/timing.json`)) run("node", ["scripts/tts.mjs", id]);
run("npx", ["remotion", "render", id, `out/${id}.mp4`, ...process.argv.slice(3)]);

// Kredit aset (wajib untuk CC-BY) — tempel ke deskripsi video
const ep = JSON.parse(readFileSync(`episodes/${id}/episode.json`, "utf8"));
const used = new Set(ep.scenes.flatMap((s) => s.objects).filter((o) => o.type === "model").map((o) => o.asset));
const lib = JSON.parse(readFileSync("assets/library.json", "utf8")).assets.filter((a) => used.has(a.id));
if (lib.length) {
  mkdirSync("out", { recursive: true });
  const lines = lib.map((a) => `"${a.title}" oleh ${a.author} (${a.license}) — ${a.source}`);
  writeFileSync(`out/${id}.credits.txt`, `Model 3D:\n${lines.join("\n")}\n`);
  console.log(`kredit aset -> out/${id}.credits.txt`);
}
