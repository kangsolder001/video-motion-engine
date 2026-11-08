import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { COLORS, FONTS, SAFE } from "./theme";
import {
  DURATION_IN_FRAMES,
  EPISODE,
  FPS,
  SCENES,
  SEGMENTS,
  activeWordIndex,
  sceneAt,
  sceneProgress,
  nextSubtitleStart,
  subtitleAt,
} from "./episode/timeline";
import { CameraRig, easeInOutCubic, easeOutCubic, lerp3 } from "./three/CameraRig";
import { GridFloor } from "./three/parts";
import { SCENE_COMPONENTS, SCENE_GAP } from "./three/World";

type Vec3 = [number, number, number];

/**
 * Keyframe kamera per scene, relatif terhadap asal scene.
 * FOV 48 dipilih karena rasio 9:16 membuat horizontal FOV sempit
 * (~29°) — FOV lebih sempit membuat objek terpotong di sisi.
 */
const CAM: Array<{
  from: Vec3;
  to: Vec3;
  targetFrom: Vec3;
  targetTo: Vec3;
}> = [
  // SC01 — hook: dekat pada antrean yang macet
  { from: [8.5, 6.5, 25], to: [5.5, 4.5, 15.5], targetFrom: [3, 2.6, -4], targetTo: [3, 2.2, -9] },
  // SC02 — context: crane ke atas, mengungkap dua jalur
  { from: [0, 8, 62], to: [0, 34, 44], targetFrom: [0, 0.5, 6], targetTo: [0, 0, -8] },
  // SC03 — explanation: orbit mengelilingi properti (khusus, lihat bawah)
  { from: [0, 0, 0], to: [0, 0, 0], targetFrom: [0, 4, 0], targetTo: [0, 4, 0] },
  // SC04 — reveal: pandangan tinggi ke tiga jalur
  { from: [0, 54, 76], to: [0, 44, 62], targetFrom: [0, 0, -6], targetTo: [0, 0, -10] },
  // SC05 — closing: tarik keluar ke horizon
  { from: [0, 10, 40], to: [0, 48, 118], targetFrom: [0, 3, -16], targetTo: [0, 2, -50] },
];

const cameraFor = (
  index: number,
  p: number,
): { pos: Vec3; target: Vec3 } => {
  const e = easeInOutCubic(p);

  if (index === 2) {
    // Orbit halus mengelilingi properti explanation
    const a = lerp3([-0.62, 0, 0], [0.62, 0, 0], e)[0];
    const R = 48;
    return {
      pos: [Math.sin(a) * R, 9 + 5 * e, Math.cos(a) * R],
      target: [0, 4, 0],
    };
  }

  const k = CAM[index] ?? CAM[0];
  return { pos: lerp3(k.from, k.to, e), target: lerp3(k.targetFrom, k.targetTo, e) };
};

/** Opacity lapisan transisi di batas scene. */
const transitionAt = (t: number): number => {
  let max = 0;
  for (let i = 1; i < SCENES.length; i++) {
    const d = Math.abs(t - SCENES[i].start);
    const window_ = 0.16;
    if (d < window_) max = Math.max(max, 1 - d / window_);
  }
  return max;
};

// ---------------------------------------------------------------------------
// Subtitle — Inter Medium, Ice White + highlight Electric Cyan (spec.md §8.3)
// ---------------------------------------------------------------------------
const Subtitles: React.FC<{ t: number }> = ({ t }) => {
  const chunk = subtitleAt(t);
  if (!chunk) return null;
  const words = chunk.text.split(" ");
  const active = activeWordIndex(t, chunk);

  // Masuk halus; keluar tepat sebelum potongan berikutnya mulai (crossfade),
  // bukan di akhir chunk — karena potongan ditahan melewati jeda napas.
  // Anchor di chunk.start (bukan t) agar saat fade-in awal `nextStart`
  // tidak malah menunjuk chunk ini sendiri, dan clamp demi monotonicitas
  // input range interpolate().
  const nextStart = nextSubtitleStart(chunk.start);
  const rawOut = nextStart !== null ? nextStart - 0.12 : chunk.end + 0.04;
  const outStart = Math.max(rawOut, chunk.start + 0.2);
  const opacity = interpolate(
    t,
    [chunk.start - 0.02, chunk.start + 0.08, outStart, outStart + 0.1],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

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
          color: COLORS.iceWhite,
          textShadow: "0 6px 40px rgba(7,17,31,0.95), 0 2px 10px rgba(7,17,31,1)",
          letterSpacing: -0.5,
        }}
      >
        {words.map((w, i) => (
          <span
            key={`${w}-${i}`}
            style={{
              color: i === active ? COLORS.electricCyan : COLORS.iceWhite,
              textShadow:
                i === active
                  ? "0 0 34px rgba(0,200,255,0.85), 0 6px 40px rgba(7,17,31,0.95)"
                  : "0 6px 40px rgba(7,17,31,0.95)",
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
// Overlay scene: label mono + headline + subline
// ---------------------------------------------------------------------------
const SceneHeader: React.FC<{ index: number; t: number }> = ({ index, t }) => {
  const scene = SCENES[index];
  const local = t - scene.start;
  const inP = interpolate(local, [0.1, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = (1 - easeOutCubic(inP)) * 46;
  const outP = interpolate(t, [scene.end - 0.35, scene.end - 0.05], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(inP, outP);

  const purposeLabel = `${String(index + 1).padStart(2, "0")} · ${scene.purpose.toUpperCase()}`;

  return (
    <AbsoluteFill
      style={{
        paddingTop: SAFE.top - 40,
        paddingLeft: SAFE.side,
        paddingRight: SAFE.side,
        opacity,
        transform: `translateY(${rise}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 30,
          letterSpacing: 6,
          color: COLORS.electricCyan,
          marginBottom: 22,
        }}
      >
        {purposeLabel}
      </div>

      <div
        style={{
          fontFamily: FONTS.heading,
          fontWeight: 700,
          fontSize: scene.headline.length > 11 ? 96 : 124,
          lineHeight: 0.98,
          color: COLORS.iceWhite,
          letterSpacing: -3,
          textShadow: "0 10px 60px rgba(7,17,31,0.9)",
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
          color: "rgba(234,244,255,0.78)",
          maxWidth: 860,
        }}
      >
        {scene.subline}
      </div>

      {/* garis aksen */}
      <div
        style={{
          marginTop: 30,
          width: interpolate(inP, [0, 1], [0, 260]),
          height: 5,
          background: COLORS.electricCyan,
          boxShadow: `0 0 26px ${COLORS.electricCyan}`,
        }}
      />
    </AbsoluteFill>
  );
};

const Branding: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 64,
      left: SAFE.side,
      right: SAFE.side,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: FONTS.mono,
      fontSize: 24,
      letterSpacing: 4,
      color: "rgba(0,200,255,0.72)",
    }}
  >
    <span>TECHNOLOGY EXPLAINED</span>
    <span style={{ color: "rgba(234,244,255,0.45)" }}>{EPISODE.id}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Komposisi utama
// ---------------------------------------------------------------------------
export const Episode: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;

  const scene = sceneAt(t);
  const p = sceneProgress(t);
  const cam = cameraFor(scene.index, p);
  const SceneComp = SCENE_COMPONENTS[scene.index] ?? SCENE_COMPONENTS[0];
  const sceneOffsetZ = -SCENE_GAP * scene.index;
  const localT = t - scene.start;
  const fade = transitionAt(t);

  // Kamera harus ikut bergeser ke asal scene, jika tidak scene 2..5
  // berada ratusan unit di belakang kamera.
  const camPos: Vec3 = [cam.pos[0], cam.pos[1], cam.pos[2] + sceneOffsetZ];
  const camTarget: Vec3 = [
    cam.target[0],
    cam.target[1],
    cam.target[2] + sceneOffsetZ,
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.deepNavy }}>
      {/* --- Lapisan 3D --- */}
      <ThreeCanvas
        width={width}
        height={height}
        flat
        dpr={1}
        camera={{ fov: 48, near: 0.1, far: 2500, position: [0, 10, 40] }}
        gl={{ antialias: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={[COLORS.deepNavy]} />
        <fog attach="fog" args={[COLORS.deepNavy, 70, 420]} />

        <ambientLight intensity={0.55} color="#9fd4ff" />
        <directionalLight position={[30, 60, 40]} intensity={1.6} color="#eaf4ff" />
        <directionalLight position={[-40, 20, -30]} intensity={0.7} color="#3D83FF" />

        <CameraRig position={camPos} target={camTarget} fov={48} />

        <group position={[0, 0, sceneOffsetZ]}>
          <GridFloor size={340} divisions={54} />
          <SceneComp t={localT} p={p} />
        </group>
      </ThreeCanvas>

      {/* --- Lapisan teks --- */}
      <Branding />
      <SceneHeader index={scene.index} t={t} />
      <Subtitles t={t} />

      {/* --- Transisi antar scene --- */}
      {fade > 0.001 ? (
        <>
          <AbsoluteFill
            style={{ backgroundColor: COLORS.deepNavy, opacity: fade * 0.94 }}
          />
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 55%, rgba(0,200,255,${fade * 0.32}) 0%, rgba(0,200,255,0) 62%)`,
            }}
          />
        </>
      ) : null}

      {/* --- Audio narasi --- */}
      {SEGMENTS.map((seg) => (
        <Sequence
          key={seg.id}
          from={Math.round(seg.start * FPS)}
          durationInFrames={Math.ceil(seg.duration * FPS) + 2}
        >
          <Audio src={staticFile(`audio/${seg.id}.mp3`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export { DURATION_IN_FRAMES };
