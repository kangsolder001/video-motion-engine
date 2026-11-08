/**
 * Timeline — sumber kebenaran waktu untuk seluruh episode (M2).
 *
 * Durasi dihitung dari audio TTS yang benar-benar dihasilkan
 * (src/episode/audio-durations.json), sehingga visual selalu sinkron
 * dengan narasi tanpa tebakan.
 */
import episode from "./episode.json";
import rawDurations from "./audio-durations.json";
import rawWords from "./words.json";

export const FPS = 30;
/** Jeda antar segmen narasi, detik. */
export const GAP = 0.2;

const durations = rawDurations as unknown as Record<string, number>;
const wordsRaw = rawWords as unknown as Record<
  string,
  { part: string; start: number; end: number }[]
>;

export type WordTiming = {
  part: string;
  /** detik, relatif terhadap awal segmennya */
  start: number;
  end: number;
};

export type SegmentTiming = {
  id: string;
  scene: string;
  text: string;
  /** detik, absolut dalam episode */
  start: number;
  end: number;
  duration: number;
  words: WordTiming[];
};

export type SceneTiming = {
  id: string;
  name: string;
  purpose: string;
  headline: string;
  subline: string;
  motion: string;
  /** detik, absolut */
  start: number;
  end: number;
  duration: number;
  /** frame absolut */
  from: number;
  to: number;
  index: number;
};

// ---------------------------------------------------------------------------
// 1. Segmen narasi
// ---------------------------------------------------------------------------
export const SEGMENTS: SegmentTiming[] = (() => {
  let cursor = 0;
  return episode.narration.map((seg) => {
    const duration = durations[seg.id];
    if (typeof duration !== "number") {
      throw new Error(
        `Durasi TTS untuk "${seg.id}" tidak ditemukan. Jalankan: npm run tts`,
      );
    }
    const start = cursor;
    const end = start + duration;
    cursor = end + GAP;
    return {
      id: seg.id,
      scene: seg.scene,
      text: seg.text,
      start,
      end,
      duration,
      words: (wordsRaw[seg.id] ?? []).map((w) => ({
        part: w.part,
        start: w.start / 1000,
        end: w.end / 1000,
      })),
    };
  });
})();

// ---------------------------------------------------------------------------
// 2. Scene (rentang waktu = rentang segmen narasinya)
// ---------------------------------------------------------------------------
export const SCENES: SceneTiming[] = (() => {
  const out: SceneTiming[] = [];
  episode.scenes.forEach((def, index) => {
    const segs = SEGMENTS.filter((s) => s.scene === def.id);
    if (segs.length === 0) return;
    const start = segs[0].start;
    const end = segs[segs.length - 1].end;
    out.push({
      id: def.id,
      name: def.name,
      purpose: def.purpose,
      headline: def.headline,
      subline: def.subline,
      motion: def.motion,
      start,
      end,
      duration: end - start,
      from: Math.round(start * FPS),
      to: Math.round(end * FPS),
      index,
    });
  });
  return out;
})();

export const TOTAL_DURATION = SEGMENTS[SEGMENTS.length - 1].end;
export const DURATION_IN_FRAMES = Math.ceil(TOTAL_DURATION * FPS);

// ---------------------------------------------------------------------------
// 3. Lookup waktu
// ---------------------------------------------------------------------------
export const sceneAt = (t: number): SceneTiming => {
  for (let i = SCENES.length - 1; i >= 0; i--) {
    if (t >= SCENES[i].start) return SCENES[i];
  }
  return SCENES[0];
};

/** Progres 0..1 dalam scene aktif. */
export const sceneProgress = (t: number): number => {
  const s = sceneAt(t);
  return Math.min(1, Math.max(0, (t - s.start) / s.duration));
};

export const segmentAt = (t: number): SegmentTiming => {
  for (let i = SEGMENTS.length - 1; i >= 0; i--) {
    if (t >= SEGMENTS[i].start) return SEGMENTS[i];
  }
  return SEGMENTS[0];
};

// ---------------------------------------------------------------------------
// 4. Subtitle — pecah kata menjadi potongan yang enak dibaca
// ---------------------------------------------------------------------------
export type SubtitleChunk = {
  text: string;
  start: number;
  end: number;
  /** index kata dalam potongan ini yang sedang diucapkan saat `start` */
  highlightFrom: number;
  highlightCount: number;
};

export const SUBTITLES: SubtitleChunk[] = (() => {
  const all: { text: string; start: number; end: number }[] = [];
  for (const seg of SEGMENTS) {
    for (const w of seg.words) {
      if (!w.part) continue;
      all.push({
        text: w.part.trim(),
        start: seg.start + w.start,
        end: seg.start + w.end,
      });
    }
  }
  all.sort((a, b) => a.start - b.start);

  const chunks: SubtitleChunk[] = [];
  let cur: { text: string; start: number; end: number }[] = [];
  const MAX_WORDS = 7;
  const PAUSE = 0.35;

  const flush = () => {
    if (cur.length === 0) return;
    chunks.push({
      text: cur.map((w) => w.text).join(" "),
      start: cur[0].start,
      end: cur[cur.length - 1].end,
      highlightFrom: 0,
      highlightCount: cur.length,
    });
    cur = [];
  };

  for (let i = 0; i < all.length; i++) {
    const w = all[i];
    if (cur.length > 0) {
      const prev = cur[cur.length - 1];
      const pause = w.start - prev.end;
      const sentenceEnd = /[.!?]$/.test(prev.text);
      if (cur.length >= MAX_WORDS || pause > PAUSE || sentenceEnd) flush();
    }
    cur.push(w);
  }
  flush();

  // Beri tahu tiap potongan berapa kata yang jadi sorotan (dipakai Subtitles)
  return chunks.map((c) => ({ ...c, highlightCount: c.text.split(" ").length }));
})();

/** Potongan subtitle aktif pada waktu `t` (detik absolut). */
export const subtitleAt = (t: number): SubtitleChunk | null => {
  let hold: SubtitleChunk | null = null;
  for (const c of SUBTITLES) {
    if (t >= c.start - 0.02 && t <= c.end + 0.12) return c;
    if (c.start <= t) hold = c;
  }
  // Tahan potongan terakhir melewati jeda napas narasi (maks 0,9 detik)
  // agar subtitle tidak menghilang di tengah kalimat.
  if (hold && t <= hold.end + 0.9) return hold;
  return null;
};

/** Awal potongan subtitle berikutnya setelah waktu `t` (null bila terakhir). */
export const nextSubtitleStart = (t: number): number | null => {
  for (const c of SUBTITLES) if (c.start > t) return c.start;
  return null;
};

/**
 * Index kata yang sedang diucapkan dalam potongan aktif.
 * Dipakai untuk highlight warna Electric Cyan (spec.md §8.3).
 */
export const activeWordIndex = (t: number, chunk: SubtitleChunk): number => {
  const words = chunk.text.split(" ");
  // Cari kata global pada waktu t, lalu petakan ke index dalam potongan
  let globalIdx = -1;
  let seen = 0;
  for (const seg of SEGMENTS) {
    for (const w of seg.words) {
      const gs = seg.start + w.start;
      const ge = seg.start + w.end;
      if (t >= gs && t <= ge) {
        globalIdx = seen;
        break;
      }
      seen++;
    }
    if (globalIdx >= 0) break;
  }
  if (globalIdx < 0) return -1;

  // Hitung offset potongan ini terhadap daftar kata global
  let offset = 0;
  for (const c of SUBTITLES) {
    if (c === chunk) break;
    offset += c.text.split(" ").length;
  }
  const local = globalIdx - offset;
  return local >= 0 && local < words.length ? local : -1;
};

export const EPISODE = episode;
