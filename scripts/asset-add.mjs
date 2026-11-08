#!/usr/bin/env node
/**
 * Tambah model 3D ke library aset: unduh/salin .glb, periksa, daftarkan.
 *
 * Usage:
 *   npm run asset:add -- --id awan-hujan --url https://.../cloud.glb \
 *     --source https://poly.pizza/m/xxxx --author "Nama" --license CC-BY-4.0 \
 *     --title "Rain cloud" --tags awan,cuaca,hujan
 *   (atau --file path/lokal.glb sebagai ganti --url, mis. setelah unzip)
 *
 * Menolak: lisensi di luar daftar, bukan GLB v2, > 15 MB, tekstur/buffer eksternal.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LIBRARY = path.join(ROOT, "assets/library.json");
const OUT = path.join(ROOT, "public/assets");
const LICENSES = ["CC0-1.0", "CC-BY-3.0", "CC-BY-4.0", "Public-Domain"];
const MAX_MB = 15;

const arg = (k) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

const id = arg("id");
const url = arg("url");
const file = arg("file");
const source = arg("source");
const author = arg("author");
const license = arg("license");
if (!id || !/^[a-z0-9-]+$/.test(id)) fail("--id wajib: huruf kecil, angka, tanda minus (mis. awan-hujan)");
if (!url && !file) fail("--url (link langsung .glb) atau --file (path lokal) wajib");
if (!source) fail("--source wajib: URL halaman aset (untuk kredit & audit lisensi)");
if (!author) fail("--author wajib");
if (!LICENSES.includes(license)) fail(`--license wajib salah satu: ${LICENSES.join(", ")} (NC/ND/editorial dilarang)`);

// --- Ambil file -----------------------------------------------------------
let buf;
if (url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) fail(`unduh gagal: HTTP ${res.status} ${url}`);
  buf = Buffer.from(await res.arrayBuffer());
} else {
  buf = await readFile(file);
}

// --- Periksa GLB ----------------------------------------------------------
const mb = buf.length / 1e6;
if (mb > MAX_MB) fail(`${mb.toFixed(1)} MB > ${MAX_MB} MB — cari versi low-poly`);
if (buf.toString("latin1", 0, 4) !== "glTF") fail("bukan file .glb (header 'glTF' tidak ada) — bila .gltf/.fbx/.obj, cari versi GLB");
if (buf.readUInt32LE(4) !== 2) fail("hanya glTF 2.0 yang didukung");
const jsonLen = buf.readUInt32LE(12);
if (buf.readUInt32LE(16) !== 0x4e4f534a) fail("chunk JSON GLB rusak");
const gltf = JSON.parse(buf.toString("utf8", 20, 20 + jsonLen));

const external = [...(gltf.buffers ?? []), ...(gltf.images ?? [])].filter((b) => b.uri && !b.uri.startsWith("data:"));
if (external.length) fail(`file merujuk ${external.length} file eksternal (${external[0].uri}) — butuh GLB mandiri`);

let triangles = 0;
for (const mesh of gltf.meshes ?? [])
  for (const p of mesh.primitives ?? []) {
    const acc = gltf.accessors?.[p.indices ?? p.attributes?.POSITION];
    if (acc) triangles += Math.round(acc.count / 3);
  }
const clips = (gltf.animations ?? []).map((a, i) => a.name || `clip-${i}`);

// --- Simpan & daftarkan ---------------------------------------------------
await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, `${id}.glb`), buf);

const lib = JSON.parse(await readFile(LIBRARY, "utf8"));
const entry = {
  id,
  file: `${id}.glb`,
  title: arg("title") ?? id,
  tags: (arg("tags") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  source,
  author,
  license,
  clips,
  triangles,
  sizeMB: Number(mb.toFixed(2)),
};
lib.assets = [...lib.assets.filter((a) => a.id !== id), entry].sort((a, b) => a.id.localeCompare(b.id));
await writeFile(LIBRARY, JSON.stringify(lib, null, 2) + "\n");

console.log(`✓ ${id}: ${mb.toFixed(2)} MB, ~${triangles} segitiga, animasi: ${clips.length ? clips.join(", ") : "-"}`);
if (triangles > 100000) console.log("  ! > 100k segitiga — render bisa lambat, pertimbangkan versi lebih ringan");
