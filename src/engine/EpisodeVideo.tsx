import { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { FONTS, SAFE } from "../theme";
import type { Episode, Theme, Timing } from "./schema.ts";
import { FPS, buildTimeline, type Timeline } from "./timeline.ts";
import { cameraAt } from "./camera.ts";
import { SceneObjects, themeColor } from "./objects";
import { useModelsReady } from "./model";
import { CameraRig, easeOutCubic } from "../three/CameraRig";
import { GridFloor } from "../three/parts";

type Vec3 = [number, number, number];

/** Jarak antar asal scene di sumbu Z — mencegah scene tumpang tindih. */
const SCENE_GAP = 150;
/** FOV 48: rasio 9:16 membuat FOV horizontal sempit (~29°). */
const FOV = 48;

export type EpisodeProps = { episode: Episode; timing: Timing };

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// ---------------------------------------------------------------------------
// Subtitle — kata yang sedang diucapkan disorot warna primary
// ---------------------------------------------------------------------------
const Subtitles: React.FC<{ tl: Timeline; t: number; theme: Theme }> = ({ tl, t, theme }) => {
  const chunk = tl.subtitleAt(t);
  if (!chunk) return null;
  const words = chunk.text.split(" ");
  const active = tl.activeWordIndex(t, chunk);
  // Keluar tepat sebelum potongan berikutnya (crossfade); clamp agar input interpolate() monoton.
  const next = tl.nextSubtitleStart(chunk.start);
  const outStart = Math.max(next !== null ? next - 0.12 : chunk.end + 0.04, chunk.start + 0.2);
  const opacity = interpolate(t, [chunk.start - 0.02, chunk.start + 0.08, outStart, outStart + 0.1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shadow = `0 6px 40px ${rgba(theme.background, 0.95)}`;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", opacity }}>
      <div
        style={{
          marginBottom: SAFE.bottom + 40,
          maxWidth: 1080 - SAFE.side * 2,
          textAlign: "center",
          fontFamily: FONTS.body,
          fontWeight: 500,
          fontSize: 56,
          lineHeight: 1.34,
          color: theme.text,
          textShadow: `${shadow}, 0 2px 10px ${theme.background}`,
          letterSpacing: -0.5,
        }}
      >
        {words.map((w, i) => (
          <span
            key={`${w}-${i}`}
            style={{
              color: i === active ? theme.primary : theme.text,
              textShadow: i === active ? `0 0 34px ${rgba(theme.primary, 0.85)}, ${shadow}` : shadow,
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Header scene: label mono + headline + subline
// ---------------------------------------------------------------------------
const SceneHeader: React.FC<{ tl: Timeline; index: number; t: number; theme: Theme }> = ({ tl, index, t, theme }) => {
  const scene = tl.scenes[index];
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const inP = interpolate(t - scene.start, [0.1, 0.7], [0, 1], clamp);
  const outP = interpolate(t, [scene.end - 0.35, scene.end - 0.05], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        paddingTop: SAFE.top - 40,
        paddingLeft: SAFE.side,
        paddingRight: SAFE.side,
        opacity: Math.min(inP, outP),
        transform: `translateY(${(1 - easeOutCubic(inP)) * 46}px)`,
      }}
    >
      <div style={{ fontFamily: FONTS.mono, fontSize: 30, letterSpacing: 6, color: theme.primary, marginBottom: 22 }}>
        {`${String(index + 1).padStart(2, "0")} · ${scene.purpose.toUpperCase()}`}
      </div>
      <div
        style={{
          fontFamily: FONTS.heading,
          fontWeight: 700,
          fontSize: scene.headline.length > 11 ? 96 : 124,
          lineHeight: 0.98,
          color: theme.text,
          letterSpacing: -3,
          textShadow: `0 10px 60px ${rgba(theme.background, 0.9)}`,
        }}
      >
        {scene.headline}
      </div>
      <div
        style={{
          marginTop: 24,
          fontFamily: FONTS.body,
          fontWeight: 500,
          fontSize: 40,
          lineHeight: 1.3,
          color: rgba(theme.text, 0.78),
          maxWidth: 860,
        }}
      >
        {scene.subline}
      </div>
      <div
        style={{
          marginTop: 30,
          width: interpolate(inP, [0, 1], [0, 260]),
          height: 5,
          background: theme.primary,
          boxShadow: `0 0 26px ${theme.primary}`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Label 3D — diproyeksikan ke layar sebagai teks HTML (tajam, tanpa font 3D)
// ---------------------------------------------------------------------------
const Labels: React.FC<{
  labels: Episode["scenes"][number]["labels"];
  p: number;
  camPos: Vec3;
  camTarget: Vec3;
  offsetZ: number;
  width: number;
  height: number;
  theme: Theme;
}> = ({ labels, p, camPos, camTarget, offsetZ, width, height, theme }) => {
  if (labels.length === 0) return null;
  const cam = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 2500);
  cam.position.set(...camPos);
  cam.lookAt(...camTarget);
  cam.updateMatrixWorld();
  const c = themeColor(theme);
  return (
    <AbsoluteFill>
      {labels.map((l, i) => {
        const [a, b] = l.show ?? [0, 1];
        const opacity = interpolate(p, [a, a + 0.06, b >= 1 ? 2 : b - 0.06, b >= 1 ? 3 : b], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const v = new THREE.Vector3(l.position[0], l.position[1], l.position[2] + offsetZ).project(cam);
        if (opacity <= 0.01 || v.z > 1) return null;
        const col = c(l.color);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.min(width - SAFE.side - 160, Math.max(SAFE.side + 160, ((v.x + 1) / 2) * width)),
              // Jaga di antara header (atas) dan subtitle (bawah), apa pun posisi 3D-nya
              top: Math.min(height - SAFE.bottom - 260, Math.max(SAFE.top + 420, ((1 - v.y) / 2) * height)),
              transform: "translate(-50%, -50%)",
              opacity,
              fontFamily: FONTS.mono,
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: 3,
              color: col,
              padding: "8px 16px",
              border: `2px solid ${rgba(col, 0.7)}`,
              background: rgba(theme.background, 0.72),
              whiteSpace: "nowrap",
              textShadow: `0 0 20px ${rgba(col, 0.6)}`,
            }}
          >
            {l.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Branding: React.FC<{ id: string; theme: Theme }> = ({ id, theme }) => (
  <div
    style={{
      position: "absolute",
      top: 64,
      left: SAFE.side,
      right: SAFE.side,
      display: "flex",
      justifyContent: "space-between",
      fontFamily: FONTS.mono,
      fontSize: 24,
      letterSpacing: 4,
      color: rgba(theme.primary, 0.72),
    }}
  >
    <span>{theme.brand}</span>
    <span style={{ color: rgba(theme.text, 0.45) }}>{id}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Komposisi utama
// ---------------------------------------------------------------------------
export const EpisodeVideo: React.FC<EpisodeProps> = ({ episode, timing }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const tl = useMemo(() => buildTimeline(episode, timing), [episode, timing]);
  const modelsReady = useModelsReady(
    episode.scenes.flatMap((s) => s.objects.flatMap((o) => (o.type === "model" ? [o.asset] : []))),
  );
  const theme = episode.theme;
  const t = frame / fps;

  const scene = tl.sceneAt(t);
  const p = tl.sceneProgress(t);
  const cam = cameraAt(scene, p);
  const offsetZ = -SCENE_GAP * scene.index;
  // Kamera ikut bergeser ke asal scene.
  const camPos: Vec3 = [cam.pos[0], cam.pos[1], cam.pos[2] + offsetZ];
  const camTarget: Vec3 = [cam.target[0], cam.target[1], cam.target[2] + offsetZ];

  // Lapisan transisi di batas scene
  let fade = 0;
  for (let i = 1; i < tl.scenes.length; i++) {
    const d = Math.abs(t - tl.scenes[i].start);
    if (d < 0.16) fade = Math.max(fade, 1 - d / 0.16);
  }

  if (!modelsReady) return null;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <ThreeCanvas
        width={width}
        height={height}
        flat
        dpr={1}
        camera={{ fov: FOV, near: 0.1, far: 2500, position: [0, 10, 40] }}
        gl={{ antialias: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={[theme.background]} />
        <fog attach="fog" args={[theme.background, 70, 420]} />
        <ambientLight intensity={0.55} color={theme.text} />
        <directionalLight position={[30, 60, 40]} intensity={1.6} color={theme.text} />
        <directionalLight position={[-40, 20, -30]} intensity={0.7} color={theme.secondary} />
        <CameraRig position={camPos} target={camTarget} fov={FOV} />
        <group position={[0, 0, offsetZ]}>
          <GridFloor size={340} divisions={54} floor={theme.floor} line={theme.gridLine} faint={theme.gridLineFaint} />
          <SceneObjects objects={scene.objects} t={t - scene.start} p={p} theme={theme} />
        </group>
      </ThreeCanvas>

      <Labels
        labels={scene.labels}
        p={p}
        camPos={camPos}
        camTarget={camTarget}
        offsetZ={offsetZ}
        width={width}
        height={height}
        theme={theme}
      />
      <Branding id={episode.id} theme={theme} />
      <SceneHeader tl={tl} index={scene.index} t={t} theme={theme} />
      <Subtitles tl={tl} t={t} theme={theme} />

      {fade > 0.001 ? (
        <>
          <AbsoluteFill style={{ backgroundColor: theme.background, opacity: fade * 0.94 }} />
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 55%, ${rgba(theme.primary, fade * 0.32)} 0%, ${rgba(theme.primary, 0)} 62%)`,
            }}
          />
        </>
      ) : null}

      {tl.segments.map((seg) => (
        <Sequence key={seg.id} from={Math.round(seg.start * FPS)} durationInFrames={Math.ceil(seg.duration * FPS) + 2}>
          <Audio src={staticFile(`episodes/${episode.id}/audio/${seg.id}.mp3`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
