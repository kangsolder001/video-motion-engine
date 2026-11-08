#!/usr/bin/env node
/**
 * Validasi episode + cek kualitas ringan. Error dicetak dalam format yang
 * bisa langsung ditempel balik ke AI untuk diperbaiki.
 *
 * Usage:
 *   npm run validate              -> semua episode
 *   npm run validate -- EP002     -> satu episode
 *   npm run validate -- --docs    -> tulis ulang docs/REFERENCE.md + docs/episode.schema.json
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { EpisodeSchema, ObjectSchema, RECIPE_TYPES, parseEpisode } from "../src/engine/schema.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);

if (args.includes("--docs")) {
  writeDocs();
  process.exit(0);
}

const ids = args.length ? args : readdirSync(path.join(ROOT, "episodes")).filter((d) => /^EP\d{3}$/.test(d));
let failed = false;

for (const id of ids) {
  const file = path.join(ROOT, "episodes", id, "episode.json");
  if (!existsSync(file)) {
    console.log(`✗ ${id}: ${file} tidak ada`);
    failed = true;
    continue;
  }
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.log(`✗ ${id}: JSON rusak — ${(e as Error).message}`);
    failed = true;
    continue;
  }
  const r = parseEpisode(json);
  if (!r.ok) {
    console.log(`✗ ${id}: ${r.errors.length} error\n  ` + r.errors.join("\n  "));
    failed = true;
    continue;
  }

  // Aset model harus terdaftar & filenya ada
  const ep = r.episode;
  const library = JSON.parse(readFileSync(path.join(ROOT, "assets/library.json"), "utf8")).assets as { id: string; file: string }[];
  const assetErrors: string[] = [];
  ep.scenes.forEach((s, si) =>
    s.objects.forEach((o, oi) => {
      if (o.type !== "model") return;
      const a = library.find((x) => x.id === o.asset);
      if (!a) assetErrors.push(`scenes.${si}.objects.${oi}.asset: "${o.asset}" belum ada di library — tambah dulu: npm run asset:add`);
      else if (!existsSync(path.join(ROOT, "public/assets", a.file))) assetErrors.push(`aset "${a.id}": file public/assets/${a.file} hilang`);
    }),
  );
  if (assetErrors.length) {
    console.log(`✗ ${id}: ${assetErrors.length} error\n  ` + assetErrors.join("\n  "));
    failed = true;
    continue;
  }

  // Peringatan kualitas (tidak menggagalkan)
  const warn: string[] = [];
  const words = ep.narration.reduce((s, n) => s + n.text.split(/\s+/).length, 0);
  const estimate = words / 2.05; // ~2.05 kata/detik pada rate +15% (terukur di EP001)
  if (estimate < 40 || estimate > 58) warn.push(`perkiraan durasi ${estimate.toFixed(0)}s (target 45–55s, ${words} kata)`);
  if (ep.scenes.length < 4 || ep.scenes.length > 6) warn.push(`${ep.scenes.length} scene (template: 4–6)`);
  ep.scenes.forEach((s) => {
    if (!s.objects.some((o) => (RECIPE_TYPES as readonly string[]).includes(o.type)))
      warn.push(`${s.id}: tanpa recipe — kamera auto memakai framing generik`);
    if (s.objects.length > 12) warn.push(`${s.id}: ${s.objects.length} objek — terlalu ramai untuk layar vertikal`);
  });
  const hasTiming = existsSync(path.join(ROOT, "episodes", id, "timing.json"));
  console.log(`✓ ${id} valid${hasTiming ? "" : `  (belum ada audio: npm run tts -- ${id})`}`);
  for (const w of warn) console.log(`  ! ${w}`);
}
process.exit(failed ? 1 : 0);

// ---------------------------------------------------------------------------
function writeDocs() {
  const schema = z.toJSONSchema(EpisodeSchema, { io: "input", unrepresentable: "any" });
  writeFileSync(path.join(ROOT, "docs/episode.schema.json"), JSON.stringify(schema, null, 2) + "\n");

  type Prop = { anyOf?: unknown[]; type?: string; enum?: unknown[]; default?: unknown; minimum?: number; maximum?: number; description?: string };
  const fmt = (name: string, p: Prop) => {
    const t = p.enum ? p.enum.map((e) => JSON.stringify(e)).join(" \\| ") : p.anyOf ? "warna" : (p.type ?? "lihat schema");
    const lim = p.minimum !== undefined || p.maximum !== undefined ? ` (${p.minimum ?? ""}–${p.maximum ?? ""})` : "";
    const def = p.default !== undefined ? `\`${JSON.stringify(p.default)}\`` : "";
    return `| \`${name}\` | ${t}${lim} | ${def} | ${p.description ?? ""} |`;
  };

  const out = [
    "# Referensi Objek Scene",
    "",
    "_File ini dibuat otomatis oleh `npm run validate -- --docs`. Jangan edit manual._",
    "",
    "Field umum di semua objek: `show` [awal, akhir] progres scene 0..1 (muncul/hilang beranimasi),",
    "`at` [x,y,z] geser objek, `pulse` {amount, speed} denyut skala.",
    "",
    "Warna: `primary`, `secondary`, `text`, `surface`, `background` (dari theme) atau hex `#RRGGBB`.",
    "",
  ];
  for (const opt of ObjectSchema.options) {
    const js = z.toJSONSchema(opt, { io: "input", unrepresentable: "any" }) as { properties: Record<string, Prop> };
    const type = (opt.shape.type as z.ZodLiteral<string>).value;
    const kind = (RECIPE_TYPES as readonly string[]).includes(type) ? "RECIPE" : "primitive";
    out.push(`## \`${type}\` — ${kind}`, "", opt.description ?? "", "", "| field | tipe | default | catatan |", "|---|---|---|---|");
    for (const [k, p] of Object.entries(js.properties)) {
      if (["type", "show", "at", "pulse"].includes(k)) continue;
      out.push(fmt(k, p));
    }
    out.push("");
  }
  writeFileSync(path.join(ROOT, "docs/REFERENCE.md"), out.join("\n"));
  console.log("docs/REFERENCE.md + docs/episode.schema.json ditulis.");
}
