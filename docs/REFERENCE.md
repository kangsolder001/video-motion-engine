# Referensi Objek Scene

_File ini dibuat otomatis oleh `npm run validate -- --docs`. Jangan edit manual._

Field umum di semua objek: `show` [awal, akhir] progres scene 0..1 (muncul/hilang beranimasi),
`at` [x,y,z] geser objek, `pulse` {amount, speed} denyut skala.

Warna: `primary`, `secondary`, `text`, `surface`, `background` (dari theme) atau hex `#RRGGBB`.

## `jam` — RECIPE

Hook: satu benda besar macet di jalur sempit, antrean menumpuk di belakangnya.

| field | tipe | default | catatan |
|---|---|---|---|
| `queue` | integer (3–20) | `11` |  |
| `color` | warna | `"primary"` |  |
| `escapeColor` | warna | `"secondary"` |  |

## `lanes` — RECIPE

Perbandingan 1–4 jalur data berdampingan. flow: fast=lancar, slow=pelan, jammed=menumpuk, lossy=paket hilang.

| field | tipe | default | catatan |
|---|---|---|---|
| `length` | number (30–250) | `100` |  |
| `gap` | number (1–20) | `6` |  |
| `lanes` | array |  | tiap item: {width 1–14, flow fast/slow/jammed/lossy, direction away/toward, color, arrow up/down/none} |

## `squeeze` — RECIPE

Dua pipa: satu lebar mengalir deras, satu menyempit dan alirannya melambat (bandwidth / bottleneck).

| field | tipe | default | catatan |
|---|---|---|---|
| `wideColor` | warna | `"secondary"` |  |
| `narrowColor` | warna | `"primary"` |  |

## `roundtrip` — RECIPE

Dua node, satu paket bolak-balik di antaranya + cincin ACK (latency, request/response, ping).

| field | tipe | default | catatan |
|---|---|---|---|
| `distance` | number (6–30) | `14` |  |
| `period` | number (0.6–6) | `1.6` |  |
| `leftColor` | warna | `"secondary"` |  |
| `rightColor` | warna | `"primary"` |  |

## `loss` — RECIPE

Deretan paket, satu menguap di tengah jalan lalu sekumpulan paket dikirim ulang (packet loss, retry).

| field | tipe | default | catatan |
|---|---|---|---|
| `color` | warna | `"primary"` |  |
| `retryColor` | warna | `"secondary"` |  |

## `hub` — RECIPE

Satu node pusat (server/router/cloud) terhubung ke banyak node (client/perangkat IoT), paket mengalir di jari-jari.

| field | tipe | default | catatan |
|---|---|---|---|
| `spokes` | integer (2–8) | `5` |  |
| `radius` | number (8–30) | `16` |  |
| `traffic` | "in" \| "out" \| "both" | `"both"` |  |
| `hubColor` | warna | `"primary"` |  |
| `spokeColor` | warna | `"secondary"` |  |

## `stack` — RECIPE

Tumpukan lapisan (arsitektur berlapis, OSI, stack teknologi). Beri nama lapisan lewat `labels`.

| field | tipe | default | catatan |
|---|---|---|---|
| `layers` | integer (2–7) | `4` |  |
| `reveal` | boolean | `true` |  |
| `colors` | array | `["secondary","primary"]` |  |

## `horizon` — RECIPE

Closing: jalur membentang ke horizon, gelombang sinyal menjauh, partikel naik. Pasangkan dengan kamera pull-out.

| field | tipe | default | catatan |
|---|---|---|---|
| `color` | warna | `"primary"` |  |

## `lane` — primitive

Jalur datar di lantai dengan tepi menyala.

| field | tipe | default | catatan |
|---|---|---|---|
| `x` | number | `0` |  |
| `width` | number (0.5–30) | `4` |  |
| `length` | number (5–300) | `90` |  |
| `color` | warna | `"primary"` |  |
| `opacity` | number (0–1) | `0.13` |  |

## `packets` — primitive

Paket data (kubus menyala) mengalir di sepanjang sumbu Z.

| field | tipe | default | catatan |
|---|---|---|---|
| `x` | number | `0` |  |
| `width` | number (0.5–30) | `4` |  |
| `count` | integer (1–40) | `12` |  |
| `length` | number (5–300) | `90` |  |
| `direction` | "away" \| "toward" | `"away"` |  |
| `speed` | number (0–1.5) | `0.2` |  |
| `color` | warna | `"primary"` |  |
| `size` | number (0.3–4) | `1.2` |  |
| `seed` | number (0–1) | `0` |  |
| `loss` | number (0–1) | `0` |  |
| `glow` | boolean | `true` |  |

## `model` — primitive

Model 3D .glb dari library aset (dicari & diunduh oleh AI). Ukuran otomatis, gaya hologram mengikuti tema.

| field | tipe | default | catatan |
|---|---|---|---|
| `asset` | string |  |  |
| `position` | array | `[0,0,0]` |  |
| `size` | number (0.5–80) | `8` |  |
| `rotationY` | number (-360–360) | `0` |  |
| `spin` | number (-180–180) | `0` |  |
| `bob` | number (0–5) | `0` |  |
| `style` | "hologram" \| "original" | `"hologram"` |  |
| `color` | warna | `"primary"` |  |
| `animation` | string,null |  |  |
| `moveTo` | array |  |  |
| `moveDuring` | array | `[0,1]` |  |

## `block` — primitive

Balok (file, data, server rack). Opsional bergerak ke `moveTo` selama `moveDuring`.

| field | tipe | default | catatan |
|---|---|---|---|
| `position` | array | `[0,1,0]` |  |
| `size` | array | `[2,2,2]` |  |
| `color` | warna | `"primary"` |  |
| `style` | "solid" \| "hero" \| "ghost" | `"solid"` |  |
| `moveTo` | array |  |  |
| `moveDuring` | array | `[0,1]` |  |

## `node` — primitive

Perangkat / server / titik jaringan (ikosahedron menyala).

| field | tipe | default | catatan |
|---|---|---|---|
| `position` | array | `[0,4,0]` |  |
| `color` | warna | `"primary"` |  |
| `scale` | number (0.2–5) | `1` |  |

## `arrow` — primitive

Panah vertikal (upload = up, download = down).

| field | tipe | default | catatan |
|---|---|---|---|
| `position` | array | `[0,8,0]` |  |
| `direction` | "up" \| "down" | `"up"` |  |
| `color` | warna | `"primary"` |  |
| `scale` | number (0.2–5) | `1` |  |

## `ring` — primitive

Cincin denyut yang melebar lalu memudar (sinyal, ping, broadcast).

| field | tipe | default | catatan |
|---|---|---|---|
| `position` | array | `[0,0.3,0]` |  |
| `color` | warna | `"primary"` |  |
| `radius` | number (1–80) | `9` |  |
| `thickness` | number (0.05–3) | `0.35` |  |
| `speed` | number (0.05–3) | `0.5` |  |
| `phase` | number (0–1) | `0` |  |
| `orientation` | "upright" \| "flat" | `"upright"` |  |

## `particles` — primitive

Partikel kecil naik perlahan — suasana.

| field | tipe | default | catatan |
|---|---|---|---|
| `count` | integer (5–120) | `40` |  |
| `area` | array | `[120,34,160]` |  |
| `color` | warna | `"primary"` |  |
| `speed` | number (0–3) | `0.9` |  |

## `light` — primitive

Lampu titik tambahan.

| field | tipe | default | catatan |
|---|---|---|---|
| `position` | array | `[0,20,10]` |  |
| `color` | warna | `"text"` |  |
| `intensity` | number (0–3000) | `400` |  |
| `distance` | number (10–500) | `150` |  |
