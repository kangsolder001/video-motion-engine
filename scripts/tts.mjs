#!/usr/bin/env node
/**
 * TTS generator — M1/M5.
 * Membaca src/episode/episode.json, menghasilkan MP3 per segmen narasi
 * + subtitle JSON (timing per kata, dari edge-tts sendiri),
 * lalu menulis durasi terukur ke src/episode/audio-durations.json.
 *
 * Pakai node-edge-tts (murni npm, tanpa Python/pip).
 * Output: 24 kHz mono MP3 48 kbps (CBR).
 *
 * Usage: node scripts/tts.mjs [--force]
 */
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EPISODE = path.join(ROOT, "src/episode/episode.json");
const OUT_DIR = path.join(ROOT, "public/audio");
const DURATIONS = path.join(ROOT, "src/episode/audio-durations.json");
const WORDS = path.join(ROOT, "src/episode/words.json");

const force = process.argv.includes("--force");

const ep = JSON.parse(await readFile(EPISODE, "utf8"));
await mkdir(OUT_DIR, { recursive: true });

/** Durasi MP3 CBR dari jumlah frame. 1 frame = 1152 sampel. */
function mp3Duration(buf) {
  let off = 0;
  if (buf.length > 10 && buf.toString("latin1", 0, 3) === "ID3") {
    const size =
      ((buf[6] & 0x7f) << 21) |
      ((buf[7] & 0x7f) << 14) |
      ((buf[8] & 0x7f) << 7) |
      (buf[9] & 0x7f);
    off = 10 + size;
  }
  let samples = 0;
  let sampleRate = 24000;
  let guard = 0;
  while (off + 4 <= buf.length && guard++ < 500000) {
    if (buf[off] === 0xff && (buf[off + 1] & 0xe0) === 0xe0) {
      const versionBits = (buf[off + 1] >> 3) & 0x03;
      const layerBits = (buf[off + 1] >> 1) & 0x03;
      const bitrateIdx = (buf[off + 2] >> 4) & 0x0f;
      const rateIdx = (buf[off + 2] >> 2) & 0x03;
      const pad = (buf[off + 2] >> 1) & 0x01;
      if (layerBits !== 1 || bitrateIdx === 0 || bitrateIdx === 0x0f || rateIdx === 3) {
        off++;
        continue;
      }
      const rates =
        versionBits === 3
          ? [44100, 48000, 32000]
          : versionBits === 2
            ? [22050, 24000, 16000]
            : [11025, 12000, 8000];
      sampleRate = rates[rateIdx];
      const frameSamples = versionBits === 3 ? 1152 : 576;
      samples += frameSamples;
      const bitrates =
        versionBits === 3
          ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
          : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
      const kbps = bitrates[bitrateIdx] * 1000;
      const len = Math.floor((frameSamples / 8) * (kbps / sampleRate)) + pad;
      if (len <= 4) {
        off++;
        continue;
      }
      off += len;
    } else {
      off++;
    }
  }
  return samples / sampleRate;
}

const { EdgeTTS } = await import("node-edge-tts");

const durations = {};
const words = {};
let anyGenerated = false;

for (const seg of ep.narration) {
  const file = path.join(OUT_DIR, `${seg.id}.mp3`);
  // edge-tts menulis subtitle sebagai "<output>.json" -> n1.mp3.json
  const subAuto = path.join(OUT_DIR, `${seg.id}.mp3.json`);
  const sub = path.join(OUT_DIR, `${seg.id}.words.json`);
  const have =
    !force && existsSync(file) && existsSync(subAuto) && (await stat(file)).size > 1000;

  if (!have) {
    const tts = new EdgeTTS({
      voice: ep.voice,
      lang: ep.language,
      rate: ep.rate ?? "default",
      saveSubtitles: true,
      timeout: 30000,
    });
    await tts.ttsPromise(seg.text, file);
    anyGenerated = true;
    process.stdout.write(`  tts ${seg.id} -> ${path.basename(file)}\n`);
  } else {
    process.stdout.write(`  skip ${seg.id} (exists)\n`);
  }

  const buf = await readFile(file);
  durations[seg.id] = Number(mp3Duration(buf).toFixed(4));

  const subSrc = existsSync(subAuto) ? subAuto : existsSync(sub) ? sub : null;
  if (subSrc) {
    const list = JSON.parse(await readFile(subSrc, "utf8"));
    if (subSrc !== sub) await writeFile(sub, JSON.stringify(list, null, 2) + "\n");
    words[seg.id] = list.map((w) => ({
      part: String(w.part).trim(),
      start: w.start,
      end: w.end,
    }));
  } else {
    console.warn(`  !! no subtitle timing for ${seg.id}`);
  }
}

await writeFile(DURATIONS, JSON.stringify(durations, null, 2) + "\n");
await writeFile(WORDS, JSON.stringify(words, null, 2) + "\n");

const GAP = 0.3;
const total = Object.values(durations).reduce((a, b) => a + b, 0);
const gaps = Math.max(0, ep.narration.length - 1) * GAP;
const estimate = total + gaps;

console.log("\n=== TTS DURATIONS ===");
for (const [k, v] of Object.entries(durations)) {
  const w = (words[k] ?? []).length;
  console.log(`  ${k}: ${v.toFixed(2)}s   (${w} kata ber-timing)`);
}
console.log(`  audio total : ${total.toFixed(2)}s`);
console.log(`  + gaps      : ${gaps.toFixed(2)}s`);
const ok = estimate >= 45 && estimate <= 55;
console.log(`  ESTIMATED   : ${estimate.toFixed(2)}s  ${ok ? "OK (45-55s)" : ">>> OUT OF RANGE 45-55s"}`);
console.log(`  generated   : ${anyGenerated}\n`);
