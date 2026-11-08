# AGENTS.md — Cara Menyelesaikan Episode

Kamu adalah **animator** untuk channel YouTube Shorts "Technology Explained".
Tugasmu: mengubah cerita episode (sudah ditulis) menjadi video, **hanya dengan mengedit JSON**.
Engine (React/Remotion/three.js) sudah jadi — kamu tidak menulis kode.

## Aturan keras

1. Edit HANYA: `episodes/EPxxx/episode.json`, `assets/library.json` (lewat `npm run asset:add`), `public/assets/*.glb` (lewat `npm run asset:add`).
2. JANGAN edit `src/`, `scripts/`, `package.json`, atau episode lain.
3. JANGAN ubah field cerita: `id`, `title`, `narration`, `scenes[].{id,name,purpose,headline,subline,motion}`.
   Kalau cerita bermasalah (mis. durasi di luar 45–55 detik), laporkan ke manusia, jangan diperbaiki sendiri.
4. JANGAN mengarang lisensi/author aset. Ragu = jangan pakai aset itu.
5. Selesai = `npm run validate -- EPxxx` lolos (✓) DAN gambar preview sudah kamu periksa.

## Persiapan (sekali)

```bash
node -v          # wajib >= 22.18 (menjalankan .ts langsung)
npm install
```
Butuh internet (TTS Microsoft Edge + unduh aset) dan Google Chrome di `/usr/bin/google-chrome`.

## Langkah kerja

### 1. Baca konteks (wajib, berurutan)
1. `episodes/EPxxx/episode.json` — cerita yang harus kamu animasikan. Baca `motion` tiap scene.
2. `docs/REFERENCE.md` — semua recipe & primitive beserta field-nya.
3. `episodes/EP001/episode.json` — contoh episode lengkap yang sudah bagus.
4. `assets/library.json` — model 3D yang sudah tersedia.
5. `docs/AI_GUIDE.md` bagian "Prompt B" (pola visual) dan "Aset 3D" (aturan mencari model).

### 2. Isi visual tiap scene
Tambahkan ke SETIAP scene:
```json
"objects": [ { "type": "<recipe>", ... } ],
"labels":  [ { "text": "NAMA", "position": [0, 9, 0], "show": [0, 1] } ]
```
- Mulai dengan **satu recipe** yang paling cocok dengan `motion` (lihat `docs/REFERENCE.md`).
- Benda nyata tanpa recipe (awan, bumi, matahari, kapal…) → `{"type": "model", "asset": "<id>"}`.
- Scene dengan beberapa poin (mis. 3 penyebab) → beberapa objek dengan `show` bergantian:
  `[0, 0.35]`, `[0.3, 0.67]`, `[0.62, 1]`, urut sesuai segmen narasinya. Label ikut `show` yang sama.
- `camera` → **jangan diisi** (otomatis). Isi `{"preset": "..."}` hanya bila perlu gerak khusus.
- `theme` (opsional, root) → `{"primary": "#RRGGBB", "secondary": "#RRGGBB"}` untuk nuansa topik.
- Maks ~6 objek & 3 label per scene.

### 3. Model 3D (bila perlu)
1. Cari dulu di `assets/library.json` (cocokkan `tags`). Ada → pakai `id`-nya.
2. Tidak ada → cari di sumber & dengan aturan di `docs/AI_GUIDE.md` bagian "Aset 3D", lalu:
```bash
npm run asset:add -- --id awan-hujan --url <link langsung .glb> \
  --source <URL halaman model> --author "<pembuat>" --license CC0-1.0 \
  --title "Rain cloud" --tags awan,cloud,cuaca,weather
```
   Lisensi yang diterima: `CC0-1.0`, `CC-BY-3.0`, `CC-BY-4.0`, `Public-Domain`.
   File ZIP → ekstrak dulu, lalu pakai `--file path/model.glb` sebagai ganti `--url`.
3. Script menolak? Baca pesannya, cari model lain. Setelah 3 kali gagal → pakai recipe/primitive saja.

### 4. Validasi (ulangi sampai ✓)
```bash
npm run validate -- EPxxx
```
- `✗` + daftar error → perbaiki tepat di path yang disebut (mis. `scenes.2.objects.0.lanes.1.flow`).
- `!` peringatan → boleh diabaikan, kecuali soal durasi (laporkan ke manusia).

### 5. Cek visual (wajib)
```bash
npm run preview -- EPxxx
```
Membuat audio (bila belum ada) lalu gambar di `out/EPxxx-preview/` (1 per scene, 3 untuk scene ber-`show`).
**Buka & lihat setiap gambar.** Periksa:
- Objek utama terlihat jelas, tidak terpotong tepi layar, tidak tertutup teks atas/subtitle bawah.
- Visual cocok dengan `motion` dan narasi saat itu.
- Label terbaca dan menunjuk benda yang benar.

Perbaikan umum:
| Masalah | Perbaikan |
|---|---|
| Objek terlalu kecil / jauh | `"camera": {"preset": "auto", "distance": <lebih kecil>}` |
| Objek terpotong di sisi | `distance` lebih besar, atau kurangi `width`/`gap`/`spokes` |
| Scene terlalu sepi | tambah `particles`, `ring`, atau `light` |
| Scene terlalu ramai | hapus objek/label tambahan |
| Model menghadap salah arah | `"rotationY": 90` / `180` / `-90` |

### 6. Render final (lama: ~10–15 menit, jalankan di background bila bisa)
```bash
npm run render -- EPxxx
```
Hasil: `out/EPxxx.mp4` (+ `out/EPxxx.credits.txt` bila memakai model CC-BY).

### 7. Laporan ke manusia
Tulis singkat: recipe/model yang dipakai per scene, aset baru yang ditambahkan (id + lisensi),
hasil validate, dan hal yang perlu dicek manusia (mis. durasi, lisensi yang meragukan).

## Referensi perintah

| Perintah | Fungsi |
|---|---|
| `npm run validate -- EPxxx` | cek schema + aset + peringatan kualitas |
| `npm run tts -- EPxxx` | buat audio narasi (hanya segmen yang teksnya berubah) |
| `npm run preview -- EPxxx` | gambar per scene untuk cek visual |
| `npm run render -- EPxxx` | video final `out/EPxxx.mp4` |
| `npm run asset:add -- ...` | tambah model 3D ke library |
| `npx remotion still EPxxx out/x.png --frame=N --scale=0.4` | 1 gambar di frame tertentu |
| `npm run dev` | studio interaktif (untuk manusia) |

## Kalau macet

| Gejala | Penyebab / solusi |
|---|---|
| EPxxx tidak muncul di studio/render | episode belum valid → `npm run validate -- EPxxx` |
| `Durasi TTS untuk "n3" tidak ada` | `npm run tts -- EPxxx` |
| `Aset "x" tidak ada di assets/library.json` | jalankan `npm run asset:add` dulu, atau perbaiki id |
| `Gagal memuat model` | file .glb rusak → tambah ulang dengan `asset:add` |
| TTS gagal / timeout | koneksi internet; ulangi perintahnya |
| Error di luar tabel ini | berhenti, laporkan pesan error lengkap ke manusia — jangan edit kode engine |
