# Panduan Produksi Episode

Engine merender video dari **satu file**: `episodes/EPxxx/episode.json`.
Tidak ada kode yang perlu ditulis per episode.

| Langkah | Siapa | Output |
|---|---|---|
| 1. Cerita | Claude (atau AI kuat lain) | `episode.json` tanpa visual (Prompt A) |
| 2. Visual | AI murah (Gemini Flash, GPT mini, DeepSeek, Qwen, …) | `episode.json` lengkap (Prompt B) + model 3D yang dicari sendiri (lihat **Aset 3D**) |
| 3. Validasi | `npm run validate -- EPxxx` | error → tempel balik ke AI murah |
| 4. Audio + render | `npm run render -- EPxxx` | `out/EPxxx.mp4` |

Preview interaktif: `npm run dev` (semua folder `episodes/EPxxx/` otomatis muncul).
Narasi diubah? `npm run tts -- EPxxx` membuat ulang hanya segmen yang teksnya berubah.

---

## Prompt A — Cerita (Claude)

Tempel ke Claude bersama topik. Output kecil = hemat token.

````
Tulis episode "Technology Explained" (YouTube Shorts 9:16, Bahasa Indonesia, pemula).
Topik: <TOPIK>   ID: EPxxx

Output HANYA JSON:
{
  "id": "EPxxx", "title": "...", "contentPillar": "...",
  "objective": "...", "mainQuestion": "...", "keyTakeaway": "...",
  "narration": [ { "id": "n1", "scene": "SC01", "text": "..." }, ... ],
  "scenes": [
    { "id": "SC01", "name": "...", "purpose": "Hook|Context|Explanation|Visual Reveal|Closing",
      "headline": "maks 18 karakter", "subline": "maks 60 karakter",
      "motion": "deskripsi visual konkret: benda apa, bergerak bagaimana, metafora apa" }
  ]
}

Aturan:
- Total narasi 95–110 kata (≈ 45–55 detik). 4–6 scene. Tiap scene ≥ 1 narasi.
- Narasi boleh dipecah jadi beberapa segmen per scene (n3, n4, n5 untuk SC03).
- "motion" adalah instruksi untuk animator: tulis dalam istilah benda di layar
  (jalur, paket data, server, lapisan, node, antrean), bukan konsep abstrak.
- Akurasi teknis wajib benar.
````

Simpan sebagai `episodes/EPxxx/episode.json`.

---

## Prompt B — Visual (AI murah)

Tempel ke AI murah: prompt ini + isi `docs/REFERENCE.md` + `episodes/EP001/episode.json` (contoh) + `assets/library.json` + JSON dari langkah 1.
Bila AI berjalan sebagai agent (punya akses web + terminal, mis. OpenCode/Aider/Cline), tambahkan juga bagian **Aset 3D** di bawah.
Bila AI mendukung *structured output / JSON schema*, berikan `docs/episode.schema.json` — hasilnya hampir pasti valid.

````
Kamu adalah animator. Lengkapi episode.json berikut dengan visual.
JANGAN ubah field cerita: id, title, narration, scenes[].{id,name,purpose,headline,subline,motion}.

Untuk SETIAP scene tambahkan:
- "objects": daftar objek. WAJIB mulai dengan satu RECIPE yang paling cocok dengan "motion".
  Recipe sudah dirancang rapi (warna, cahaya, kamera); primitive hanya untuk tambahan kecil.
- "labels" (opsional, maks 3): {"text": "MAKS 18 HURUF", "position": [x,y,z], "show": [a,b]}
  untuk menamai benda penting. Posisi dekat objeknya, y sedikit di atasnya.
- "camera": hilangkan saja (kamera otomatis mengikuti recipe), kecuali butuh gerak khusus:
  {"preset": "push-in" | "pull-out" | "crane-up" | "orbit" | "top-down" | "static"}.

Tambahkan "theme" di root bila episode butuh nuansa warna lain:
{"primary": "#RRGGBB", "secondary": "#RRGGBB", "brand": "NAMA CHANNEL"}.
Gunakan warna terang di atas background gelap. Tanpa theme = gaya default channel.

Pola yang terbukti bagus:
- Hook → "jam" (masalah/hambatan) atau "hub" (skala/banyak perangkat).
- Context → "lanes" 2 jalur untuk perbandingan, "stack" untuk arsitektur berlapis.
- Explanation dengan beberapa poin → beberapa recipe dalam satu scene dengan "show"
  bergantian, misal [0,0.35], [0.3,0.67], [0.62,1] (sedikit tumpang tindih = crossfade).
  Samakan dengan urutan segmen narasinya. Satu label per poin dengan "show" yang sama.
- Visual Reveal → "lanes" 3 jalur dengan flow berbeda.
- Closing → "horizon".
- Maksimal ~6 objek per scene; layar vertikal cepat penuh.
- Benda nyata yang tidak ada recipe-nya (awan, bumi, matahari, kapal, satelit, hewan…)
  → objek "model" dengan "asset" dari library aset. Belum ada di library? Cari & tambahkan
  sesuai bagian "Aset 3D". Maks 3 model per scene.

Output HANYA JSON lengkap, tanpa penjelasan.
````

### Loop perbaikan
```
npm run validate -- EPxxx
```
- `✗` + daftar error → tempel apa adanya ke AI murah: "Perbaiki error ini, output JSON lengkap."
- `!` peringatan → boleh diabaikan, tapi perkiraan durasi di luar 45–55 detik berarti narasi perlu dirapikan (kembali ke langkah 1).

Cek cepat sebelum render penuh (1 frame, beberapa detik):
```
npx remotion still EPxxx out/check.png --frame=150 --scale=0.4
```

---

## Aset 3D — aturan untuk AI yang mencari model sendiri

Tempel bagian ini ke AI agent bersama Prompt B.

````
Kamu boleh mencari model 3D sendiri untuk benda yang tidak ada recipe-nya.

URUTAN KERJA
1. Cek assets/library.json dulu. Ada aset dengan tags yang cocok? Pakai id-nya, jangan unduh lagi.
2. Belum ada → cari di sumber di bawah, urut dari atas.
3. Tambahkan dengan:
   npm run asset:add -- --id <id> --url <link langsung .glb> --source <URL halaman model> \
     --author "<pembuat>" --license <lisensi> --title "<judul>" --tags <tag1,tag2>
   (file ZIP: unduh & ekstrak dulu, lalu pakai --file <path .glb>)
4. Pakai di scene: {"type": "model", "asset": "<id>", "size": 8}
5. npm run validate -- EPxxx

SUMBER (cek lisensi di halaman tiap model, bukan asumsi)
- Poly Pizza      https://poly.pizza            low-poly, tombol download GLB; banyak CC0 / CC-BY
- Kenney          https://kenney.nl/assets      semua CC0; paket ZIP, ambil file .glb di dalamnya
- Quaternius      https://quaternius.com        CC0, banyak model beranimasi (pilih format glTF/GLB)
- NASA 3D         https://science.nasa.gov/3d-resources/   bumi, planet, satelit; --license Public-Domain
- Sketchfab       https://sketchfab.com         hanya filter "Downloadable" + CC0/CC-BY; butuh login,
                                                biasanya diunduh manusia lalu --file

ATURAN (WAJIB)
- Lisensi hanya: CC0-1.0, CC-BY-3.0, CC-BY-4.0, Public-Domain.
  DILARANG: NC (non-commercial), ND (no-derivatives), Editorial, lisensi toko/"royalty free",
  atau lisensi yang tidak tertulis jelas. Ragu = jangan pakai.
- --source = URL HALAMAN model (bukan link file), --author = nama pembuat asli. Untuk CC-BY,
  kredit otomatis ditulis ke out/EPxxx.credits.txt saat render.
- Format .glb mandiri (tekstur tertanam), ≤ 15 MB, idealnya < 50.000 segitiga. Pilih low-poly.
- id: huruf kecil-tanda minus, deskriptif, Bahasa Indonesia (awan-hujan, bumi, matahari).
- Tags: 3–6 kata kunci Indonesia + Inggris (awan,cloud,cuaca,weather) agar mudah dipakai ulang.
- Biarkan "style": "hologram" (default) agar seragam dengan gaya channel. Pakai "original"
  hanya bila warna asli penting untuk dipahami (mis. peta bumi).
- Model punya animasi (lihat "clips" di library)? Isi "animation" dengan nama klip, atau
  biarkan kosong untuk klip pertama, atau null agar diam.
- Gerak tambahan: "spin" (derajat/detik), "bob" (melayang), "moveTo" + "moveDuring".
- Tidak menemukan model berlisensi aman dalam beberapa percobaan? Pakai recipe/primitive saja.
  JANGAN mengarang lisensi atau author.
````

Ukuran model dinormalisasi otomatis (sisi terpanjang = `size`, alas menempel lantai), dan kamera
auto membingkai model bila scene tidak punya recipe — AI tidak perlu tahu skala asli file.

---

## Untuk developer: menambah recipe baru

Recipe = adegan siap pakai. Tambah satu bila beberapa episode butuh visual yang belum ada.
1. Schema + deskripsi di `src/engine/schema.ts` (array `recipes`).
2. Komponen di `src/engine/objects.tsx` (bagian RECIPES) + `case` di `Body`.
3. Framing kamera bawaan di `src/engine/camera.ts` (`framingFor`).
4. `npm run validate -- --docs` untuk memperbarui `docs/REFERENCE.md` & schema JSON.
