import { Composition } from "remotion";
import { EpisodeVideo } from "./engine/EpisodeVideo";
import { parseEpisode, type Timing } from "./engine/schema.ts";
import { FPS, buildTimeline } from "./engine/timeline.ts";
import { Smoke } from "./smoke/Smoke";
import { VIDEO } from "./theme";

// Setiap folder episodes/EPxxx/ otomatis menjadi satu komposisi.
// require.context harus dipanggil literal agar webpack bisa menganalisisnya.
declare global {
  namespace NodeJS {
    interface Require {
      context(dir: string, deep: boolean, re: RegExp): { keys(): string[]; (key: string): unknown };
    }
  }
}
const episodes = require.context("../episodes", true, /\/EP\d{3}\/episode\.json$/);
const timings = require.context("../episodes", true, /\/EP\d{3}\/timing\.json$/);

// Episode yang belum valid (mis. visual belum diisi) dilewati agar episode lain tetap bisa dirender.
const entries = episodes.keys().flatMap((key) => {
  const r = parseEpisode(episodes(key));
  if (!r.ok) {
    console.warn(`${key} dilewati (tidak valid) — jalankan: npm run validate`);
    return [];
  }
  const timingKey = key.replace("episode.json", "timing.json");
  const timing = timings.keys().includes(timingKey) ? (timings(timingKey) as Timing) : null;
  if (!timing) console.warn(`${r.episode.id}: timing.json belum ada — jalankan: npm run tts ${r.episode.id}`);
  return { episode: r.episode, timing };
});

export const RemotionRoot: React.FC = () => (
  <>
    {entries.map(({ episode, timing }) =>
      timing ? (
        <Composition
          key={episode.id}
          id={episode.id}
          component={EpisodeVideo}
          durationInFrames={buildTimeline(episode, timing).durationInFrames}
          fps={FPS}
          width={VIDEO.width}
          height={VIDEO.height}
          defaultProps={{ episode, timing }}
        />
      ) : null,
    )}
    {/* Uji pipeline */}
    <Composition id="Smoke" component={Smoke} durationInFrames={90} fps={FPS} width={VIDEO.width} height={VIDEO.height} />
  </>
);
