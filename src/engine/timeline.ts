/**
 * Timeline — waktu scene & subtitle dihitung dari audio TTS yang benar-benar
 * dihasilkan (timing.json), sehingga visual selalu sinkron dengan narasi.
 * Pure: dipakai oleh Remotion dan oleh scripts/check-subtitles.ts.
 */
import type { Episode, Scene, Timing } from "./schema.ts";

export const FPS = 30;
/** Jeda antar segmen narasi, detik. */
export const GAP = 0.2;

export type WordTiming = { part: string; start: number; end: number };

export type SegmentTiming = {
  id: string;
  scene: string;
  /** detik, absolut */
  start: number;
  end: number;
  duration: number;
  /** detik, absolut */
  words: WordTiming[];
};

export type SceneTiming = Scene & {
  start: number;
  end: number;
  duration: number;
  index: number;
};

export type SubtitleChunk = { text: string; start: number; end: number; wordOffset: number };

export type Timeline = ReturnType<typeof buildTimeline>;

export const buildTimeline = (episode: Episode, timing: Timing) => {
  // 1. Segmen narasi
  let cursor = 0;
  const segments: SegmentTiming[] = episode.narration.map((seg) => {
    const duration = timing.durations[seg.id];
    if (typeof duration !== "number") {
      throw new Error(`Durasi TTS untuk "${seg.id}" tidak ada. Jalankan: npm run tts ${episode.id}`);
    }
    const start = cursor;
    cursor = start + duration + GAP;
    return {
      id: seg.id,
      scene: seg.scene,
      start,
      end: start + duration,
      duration,
      words: (timing.words[seg.id] ?? [])
        .filter((w) => w.part.trim())
        .map((w) => ({ part: w.part.trim(), start: start + w.start / 1000, end: start + w.end / 1000 })),
    };
  });

  // 2. Scene = rentang segmen narasinya
  const scenes: SceneTiming[] = [];
  episode.scenes.forEach((def) => {
    const segs = segments.filter((s) => s.scene === def.id);
    if (segs.length === 0) return;
    const start = segs[0].start;
    const end = segs[segs.length - 1].end;
    scenes.push({ ...def, start, end, duration: end - start, index: scenes.length });
  });

  // 3. Subtitle — potong per 7 kata / jeda > 0.35 s / akhir kalimat,
  //    tapi jangan sisakan 1–2 kata yatim di akhir kalimat (maks 9 kata).
  const words = segments.flatMap((s) => s.words).sort((a, b) => a.start - b.start);
  const subtitles: SubtitleChunk[] = [];
  let cur: WordTiming[] = [];
  let offset = 0;
  const flush = () => {
    if (cur.length === 0) return;
    subtitles.push({
      text: cur.map((w) => w.part).join(" "),
      start: cur[0].start,
      end: cur[cur.length - 1].end,
      wordOffset: offset,
    });
    offset += cur.length;
    cur = [];
  };
  const leftInSentence = (i: number) => {
    let n = 0;
    while (i + n < words.length && !/[.!?]$/.test(words[i + n].part)) n++;
    return n + 1;
  };
  words.forEach((w, i) => {
    const prev = cur[cur.length - 1];
    const full = cur.length >= 9 || (cur.length >= 7 && leftInSentence(i) > 2);
    if (prev && (full || w.start - prev.end > 0.35 || /[.!?]$/.test(prev.part))) flush();
    cur.push(w);
  });
  flush();

  const total = segments[segments.length - 1].end;

  const sceneAt = (t: number): SceneTiming => {
    for (let i = scenes.length - 1; i >= 0; i--) if (t >= scenes[i].start) return scenes[i];
    return scenes[0];
  };

  /** Potongan subtitle aktif; ditahan melewati jeda napas (maks 0.9 s). */
  const subtitleAt = (t: number): SubtitleChunk | null => {
    let hold: SubtitleChunk | null = null;
    for (const c of subtitles) {
      if (t >= c.start - 0.02 && t <= c.end + 0.12) return c;
      if (c.start <= t) hold = c;
    }
    return hold && t <= hold.end + 0.9 ? hold : null;
  };

  const nextSubtitleStart = (t: number): number | null => {
    for (const c of subtitles) if (c.start > t) return c.start;
    return null;
  };

  /** Index kata yang sedang diucapkan dalam potongan (−1 bila tidak ada). */
  const activeWordIndex = (t: number, chunk: SubtitleChunk): number => {
    const n = chunk.text.split(" ").length;
    for (let i = 0; i < n; i++) {
      const w = words[chunk.wordOffset + i];
      if (w && t >= w.start && t <= w.end) return i;
    }
    return -1;
  };

  return {
    segments,
    scenes,
    subtitles,
    words,
    total,
    durationInFrames: Math.ceil(total * FPS),
    sceneAt,
    sceneProgress: (t: number) => {
      const s = sceneAt(t);
      return Math.min(1, Math.max(0, (t - s.start) / s.duration));
    },
    subtitleAt,
    nextSubtitleStart,
    activeWordIndex,
  };
};
