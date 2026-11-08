#!/usr/bin/env node
/**
 * QC tool: baca spesifikasi teknis sebuah file MP4 tanpa ffprobe.
 * Environment ini tidak punya ffmpeg, jadi parser box MP4 ditulis sendiri.
 *
 * Usage: node scripts/probe-mp4.mjs out/video.mp4
 */
import { open } from "node:fs/promises";
import { basename } from "node:path";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/probe-mp4.mjs <file.mp4>");
  process.exit(1);
}

const buf = await open(path).then((f) => f.readFile());
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

const u32 = (o) => dv.getUint32(o);
const u64 = (o) => Number(dv.getBigUint64(o));
const str = (o, n) => Buffer.from(buf.subarray(o, o + n)).toString("latin1");

const result = { file: basename(path), bytes: buf.length };

/** Traverse top-level boxes recursively, invoking cb(type, start, end). */
function walk(start, end, cb, depth = 0) {
  let off = start;
  while (off + 8 <= end && depth < 8) {
    let size = u32(off);
    const type = str(off + 4, 4);
    let header = 8;
    if (size === 1) {
      size = u64(off + 8);
      header = 16;
    } else if (size === 0) {
      size = end - off;
    }
    if (size < header || off + size > end) break;
    cb(type, off, off + size, header);
    off += size;
  }
}

let fps = null;
let durationSec = null;
let timescale = null;

walk(0, buf.length, (type, s, e) => {
  if (type === "moov") {
    walk(s + 8, e, (t2, s2, e2) => {
      if (t2 === "mvhd") {
        const version = dv.getUint8(s2 + 8);
        // FullBox(4) + creation/modification (4 atau 8) lalu timescale.
        const p = s2 + 12 + (version === 1 ? 16 : 8);
        timescale = u32(p);
        const dur = version === 1 ? u64(p + 4) : u32(p + 4);
        durationSec = dur / timescale;
      }
      if (t2 === "trak") {
        let width = 0;
        let height = 0;
        let sampleDelta = 0;
        let mdhdTimescale = 0;
        let isVideo = false;

        // Named function agar bisa rekursi ke mdia/minf/stbl.
        const visitTrak = (t3, s3, e3, h3) => {
          if (t3 === "mdia" || t3 === "minf" || t3 === "stbl") {
            walk(s3 + h3, e3, visitTrak);
          }
          if (t3 === "tkhd") {
            // width/height 16.16 fixed point di akhir tkhd
            const base = s3 + h3 + (dv.getUint8(s3 + 8) === 1 ? 84 : 76);
            width = u32(base) / 65536;
            height = u32(base + 4) / 65536;
          }
          if (t3 === "stsd") {
            // full box (4) + entry count (4) + size (4) lalu format 4-char.
            const fmt = s3 + h3 + 12;
            const fourcc = str(fmt, 4);
            if (fourcc === "avc1" || fourcc === "hev1" || fourcc === "hvc1" || fourcc === "av01") {
              result.videoCodec = fourcc;
              isVideo = true;
            }
          }
          if (t3 === "stts") {
            // full box (4) + entry count (4); entri pertama: count(4) delta(4)
            const entries = u32(s3 + h3 + 4);
            if (entries > 0) {
              sampleDelta = u32(s3 + h3 + 12);
            }
          }
          if (t3 === "mdhd") {
            const version = dv.getUint8(s3 + 8);
            mdhdTimescale = u32(s3 + 12 + (version === 1 ? 16 : 8));
          }
        };

        walk(s2 + 8, e2, visitTrak);

        if (width > 0) {
          result.width = width;
          result.height = height;
        }
        // Hanya trak video yang boleh menentukan fps.
        if (isVideo && sampleDelta && mdhdTimescale) {
          fps = mdhdTimescale / sampleDelta;
          result.fps = Number(fps.toFixed(3));
        }
      }
    });
  }
  if (type === "ftyp") {
    result.brand = str(s + 8, 4);
  }
});

// Audio track codec: scan for 'mp4a' / 'ac-3' anywhere
const ascii = buf.toString("latin1");
if (ascii.includes("mp4a")) result.audioCodec = "AAC (mp4a)";
else if (ascii.includes("ac-3")) result.audioCodec = "AC-3";
else if (ascii.includes("sowt") || ascii.includes("twos"))
  result.audioCodec = "PCM";

result.durationSec = durationSec ? Number(durationSec.toFixed(3)) : null;

// ---- verdict against spec.md §9.1 ----
const checks = [
  ["resolution 1080x1920", result.width === 1080 && result.height === 1920],
  ["fps 30", Math.abs((result.fps ?? 0) - 30) < 0.05],
  ["video codec H.264", (result.videoCodec ?? "").includes("avc1")],
  ["audio codec AAC", (result.audioCodec ?? "").startsWith("AAC")],
  ["duration 45-55s", (result.durationSec ?? 0) >= 45 && result.durationSec <= 55],
  ["container MP4", result.brand === "isom" || result.brand === "mp42"],
];

console.log("\n=== MP4 PROBE ===");
console.log(result);
console.log("\n=== QC (spec.md §9.1) ===");
let pass = true;
for (const [label, ok] of checks) {
  if (!ok) pass = false;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
}
console.log(`\nRESULT: ${pass ? "ALL PASS" : "SOME CHECKS FAILED"}\n`);
process.exit(pass ? 0 : 1);
