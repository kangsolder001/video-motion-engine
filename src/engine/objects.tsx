/**
 * Renderer objek scene: recipe (adegan jadi) + primitive (bahan mentah).
 * Semua animasi fungsi murni dari waktu `t` (detik lokal scene) dan
 * progres `p` — deterministik per frame, aman untuk render Remotion.
 */
import type { SceneObject, Theme } from "./schema.ts";
import { Arrow, Lane, Node, Packets, Ring } from "../three/parts";
import { Glow } from "../three/glow";
import { easeInOutCubic, easeOutBack, pulse } from "../three/CameraRig";
import { Model } from "./model";

type Vec3 = [number, number, number];
type ColorFn = (c: string) => string;
type Ctx = { t: number; /** progres dalam jendela `show` (atau scene) */ wp: number; c: ColorFn };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Envelope masuk-keluar untuk jendela tampil. */
const env = (p: number, i0: number, i1: number, o0: number, o1: number): number => {
  if (p <= i0) return 0;
  if (p < i1) return (p - i0) / (i1 - i0);
  if (p <= o0) return 1;
  if (p < o1) return 1 - (p - o0) / (o1 - o0);
  return 0;
};

export const themeColor = (theme: Theme): ColorFn => (c) =>
  c.startsWith("#") ? c : (theme as Record<string, string>)[c] ?? theme.primary;

// ===========================================================================
// Wrapper umum: show / at / pulse
// ===========================================================================
export const SceneObjects: React.FC<{ objects: SceneObject[]; t: number; p: number; theme: Theme }> = ({
  objects,
  t,
  p,
  theme,
}) => {
  const c = themeColor(theme);
  return (
    <group>
      {objects.map((o, i) => {
        let s = 1;
        let wp = p;
        if (o.show) {
          const [a, b] = o.show;
          const e = env(p, a, a + 0.07, b >= 1 ? 2 : b - 0.07, b >= 1 ? 3 : b);
          if (e <= 0.01) return null;
          s = easeOutBack(Math.min(1, e));
          wp = clamp01((p - a) / (b - a));
        }
        if (o.pulse) s *= 1 + pulse(t, o.pulse.speed) * o.pulse.amount;
        return (
          <group key={i} position={o.at ?? [0, 0, 0]} scale={s}>
            <Body o={o} ctx={{ t, wp, c }} />
          </group>
        );
      })}
    </group>
  );
};

const Body: React.FC<{ o: SceneObject; ctx: Ctx }> = ({ o, ctx }) => {
  const { t, wp, c } = ctx;
  switch (o.type) {
    // ----------------------------------------------------------------- recipes
    case "jam":
      return <Jam queue={o.queue} color={c(o.color)} escape={c(o.escapeColor)} t={t} wp={wp} />;
    case "lanes":
      return <Lanes o={o} t={t} c={c} />;
    case "squeeze":
      return <Squeeze wide={c(o.wideColor)} narrow={c(o.narrowColor)} t={t} wp={wp} text={c("text")} />;
    case "roundtrip":
      return (
        <Roundtrip distance={o.distance} period={o.period} left={c(o.leftColor)} right={c(o.rightColor)} text={c("text")} t={t} />
      );
    case "loss":
      return <Loss color={c(o.color)} retry={c(o.retryColor)} text={c("text")} t={t} />;
    case "hub":
      return <Hub o={o} t={t} c={c} />;
    case "stack":
      return <Stack layers={o.layers} reveal={o.reveal} colors={o.colors.map(c)} t={t} wp={wp} />;
    case "horizon":
      return <Horizon color={c(o.color)} second={c("secondary")} t={t} />;
    // -------------------------------------------------------------- primitives
    case "lane":
      return <Lane x={o.x} width={o.width} length={o.length} color={c(o.color)} opacity={o.opacity} />;
    case "packets":
      return (
        <Packets
          x={o.x}
          laneWidth={o.width}
          count={o.count}
          baseZ={0}
          length={o.length}
          dir={o.direction === "toward" ? 1 : -1}
          speed={o.speed}
          t={t}
          color={c(o.color)}
          size={o.size}
          seed={o.seed}
          lossRate={o.loss}
          glow={o.glow}
        />
      );
    case "block": {
      const k = easeInOutCubic(clamp01((wp - o.moveDuring[0]) / (o.moveDuring[1] - o.moveDuring[0])));
      const to = o.moveTo ?? o.position;
      const pos: Vec3 = [0, 1, 2].map((i) => o.position[i] + (to[i] - o.position[i]) * k) as Vec3;
      return <Block position={pos} size={o.size} color={c(o.color)} style={o.style} />;
    }
    case "node":
      return <Node position={o.position} color={c(o.color)} scale={o.scale} />;
    case "arrow":
      return <Arrow position={o.position} sign={o.direction === "up" ? 1 : -1} color={c(o.color)} scale={o.scale} />;
    case "ring":
      return (
        <group position={o.position} rotation-x={o.orientation === "flat" ? -Math.PI / 2 : 0}>
          <Ring
            position={[0, 0, 0]}
            progress={(t * o.speed + o.phase) % 1}
            color={c(o.color)}
            maxRadius={o.radius}
            thickness={o.thickness}
          />
        </group>
      );
    case "particles":
      return <Particles count={o.count} area={o.area} color={c(o.color)} speed={o.speed} t={t} />;
    case "model": {
      const k = easeInOutCubic(clamp01((wp - o.moveDuring[0]) / (o.moveDuring[1] - o.moveDuring[0])));
      const to = o.moveTo ?? o.position;
      const pos: Vec3 = [0, 1, 2].map((i) => o.position[i] + (to[i] - o.position[i]) * k) as Vec3;
      return (
        <Model
          asset={o.asset}
          position={pos}
          size={o.size}
          rotationY={o.rotationY}
          spin={o.spin}
          bob={o.bob}
          style={o.style}
          color={c(o.color)}
          animation={o.animation === undefined ? "" : o.animation}
          t={t}
        />
      );
    }
    case "light":
      return <pointLight position={o.position} color={c(o.color)} intensity={o.intensity} distance={o.distance} />;
  }
};

// ===========================================================================
// Bagian kecil
// ===========================================================================
const Box: React.FC<{ position: Vec3; size: Vec3; color: string; glow?: number; opacity?: number }> = ({
  position,
  size,
  color,
  glow = 0,
  opacity = 1,
}) => (
  <group position={position}>
    <mesh>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    {glow > 0 ? <Glow position={[0, 0, 0]} scale={glow} color={color} opacity={0.45} /> : null}
  </group>
);

const Block: React.FC<{ position: Vec3; size: Vec3; color: string; style: "solid" | "hero" | "ghost" }> = ({
  position,
  size,
  color,
  style,
}) => {
  const glow = Math.max(...size) * 3.6;
  if (style === "solid") return <Box position={position} size={size} color={color} glow={glow} />;
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        {style === "hero" ? (
          <meshStandardMaterial color="#0d2338" emissive={color} emissiveIntensity={0.7} metalness={0.7} roughness={0.25} />
        ) : (
          <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
        )}
      </mesh>
      <mesh scale={1.06}>
        <boxGeometry args={size} />
        <meshBasicMaterial color={color} wireframe transparent opacity={style === "hero" ? 0.45 : 0.7} />
      </mesh>
      <Glow position={[0, 0, 0]} scale={glow} color={color} opacity={style === "hero" ? 0.4 : 0.25} />
    </group>
  );
};

const Particles: React.FC<{ count: number; area: Vec3; color: string; speed: number; t: number }> = ({
  count,
  area,
  color,
  speed,
  t,
}) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const seed = i * 0.6180339887;
      const x = ((seed * 137.5) % 1) * area[0] - area[0] / 2;
      const z = ((seed * 71.3) % 1) * area[2] - area[2] * 0.75;
      const y = ((t * speed * 0.1 * 9 + seed * 10) % 1) * area[1];
      return (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      );
    })}
  </group>
);

/** Silinder tipis dari a ke b (garis koneksi). */
const Beam: React.FC<{ a: Vec3; b: Vec3; color: string; opacity?: number; radius?: number }> = ({
  a,
  b,
  color,
  opacity = 0.3,
  radius = 0.08,
}) => {
  const d: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(...d);
  const mid: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  // Silinder default searah Y: Rx(pitch) lalu Ry(yaw) mengarahkannya ke d
  const yaw = Math.atan2(d[0], d[2]);
  const pitch = Math.acos(Math.max(-1, Math.min(1, d[1] / (len || 1))));
  return (
    <mesh position={mid} rotation={[pitch, yaw, 0, "YXZ"]}>
      <cylinderGeometry args={[radius, radius, len, 6]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
};

// ===========================================================================
// RECIPES
// ===========================================================================

/** Hook: file besar macet, antrean menumpuk. */
const Jam: React.FC<{ queue: number; color: string; escape: string; t: number; wp: number }> = ({
  queue,
  color,
  escape,
  t,
  wp,
}) => {
  const creep = Math.min(1, wp * 2.2);
  const blockZ = -4 - creep * 3.5;
  const s = 1 + pulse(t, 1.6) * 0.05;
  return (
    <group>
      <Lane x={0} width={3.4} length={78} color={color} />
      <group position={[0, 2.4, blockZ]} scale={s}>
        <Block position={[0, 0, 0]} size={[4.6, 4.2, 6.6]} color={color} style="hero" />
      </group>
      {Array.from({ length: queue }, (_, i) => (
        <Box
          key={i}
          position={[0, 0.72, 1 + i * 3 - creep * 3.5 + Math.sin(t * 2.2 + i * 0.6) * 0.18]}
          size={[1.7, 1.3, 1.9]}
          color={color}
          glow={7}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <Box key={`e${i}`} position={[0, 0.7, -22 - i * 9 - ((t * 1.6) % 9)]} size={[1.7, 1.3, 1.9]} color={escape} glow={7} opacity={0.75} />
      ))}
      <pointLight position={[0, 14, 4]} color={color} intensity={220} distance={80} />
    </group>
  );
};

/** Perbandingan jalur: lebar, posisi, kepadatan & kecepatan dihitung otomatis dari `flow`. */
const Lanes: React.FC<{ o: Extract<SceneObject, { type: "lanes" }>; t: number; c: ColorFn }> = ({ o, t, c }) => {
  const total = o.lanes.reduce((s, l) => s + l.width, 0) + o.gap * (o.lanes.length - 1);
  let x = -total / 2;
  const intensity = Math.max(1, total / 16);
  return (
    <group>
      {o.lanes.map((l, i) => {
        const cx = x + l.width / 2;
        x += l.width + o.gap;
        const col = c(l.color);
        const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, Math.round(v)));
        const P = {
          fast: { count: clampN(l.width * 3, 8, 26), speed: 0.4, loss: 0, glow: true, opacity: 0.16 },
          slow: { count: clampN(l.width * 3.5, 6, 16), speed: 0.06, loss: 0, glow: true, opacity: 0.13 },
          jammed: { count: clampN(o.length / 3.2, 10, 40), speed: 0.015, loss: 0, glow: true, opacity: 0.13 },
          lossy: { count: clampN(l.width * 3.3, 8, 22), speed: 0.22, loss: 0.34, glow: false, opacity: 0.1 },
        }[l.flow];
        return (
          <group key={i}>
            <Lane x={cx} width={l.width} length={o.length} color={col} opacity={P.opacity} />
            <Packets
              x={cx}
              laneWidth={l.width}
              count={P.count}
              baseZ={0}
              length={o.length}
              dir={l.direction === "toward" ? 1 : -1}
              speed={P.speed}
              t={t}
              color={col}
              size={Math.min(1.7, 1.2 + l.width * 0.05)}
              seed={(i * 0.37) % 1}
              lossRate={P.loss}
              glow={P.glow}
            />
            {l.flow === "lossy"
              ? [0, 1, 2].map((k) => (
                  <Ring
                    key={k}
                    position={[cx, 0.4, -o.length * 0.3 + k * o.length * 0.3]}
                    progress={(t * 0.45 + k * 0.33) % 1}
                    color={col}
                    maxRadius={l.width + 1.5}
                    thickness={0.25}
                  />
                ))
              : null}
            {l.arrow !== "none" ? (
              <Arrow position={[cx, 9, -6]} sign={l.arrow === "up" ? 1 : -1} color={col} scale={l.width > 6 ? 1.5 : 1.3} />
            ) : null}
          </group>
        );
      })}
      <pointLight position={[0, 26 + total * 0.4, 10 + total * 0.3]} color={c("text")} intensity={400 * intensity} distance={160 * intensity} />
      <pointLight position={[-total, 10, 0]} color={c("secondary")} intensity={220 * intensity} distance={120 * intensity} />
    </group>
  );
};

const FlowDots: React.FC<{ x: number; radius: number; count: number; t: number; color: string; speed: number }> = ({
  x,
  radius,
  count,
  t,
  color,
  speed,
}) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const z = 14 - ((i / count + t * speed) % 1) * 28;
      return (
        <group key={i} position={[x + Math.cos(i * 2.1) * radius * 0.5, 4 + Math.sin(i * 2.1) * radius * 0.5, z]}>
          <mesh>
            <boxGeometry args={[0.9, 0.9, 1.4]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <Glow position={[0, 0, 0]} scale={5} color={color} opacity={0.5} />
        </group>
      );
    })}
  </group>
);

/** Pipa lebar vs pipa yang menyempit. */
const Squeeze: React.FC<{ wide: string; narrow: string; text: string; t: number; wp: number }> = ({
  wide,
  narrow,
  text,
  t,
  wp,
}) => {
  const r = 4 - 2.6 * easeInOutCubic(Math.min(1, wp * 2.5));
  return (
    <group>
      <mesh position={[-5, 4, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[4, 4, 30, 28, 1, true]} />
        <meshBasicMaterial color={wide} wireframe transparent opacity={0.55} />
      </mesh>
      <mesh position={[5, 4, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[r, r, 30, 28, 1, true]} />
        <meshBasicMaterial color={narrow} wireframe transparent opacity={0.85} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[5 + s * (r + 2.4), 4, 0]} rotation-z={(-s * Math.PI) / 2}>
          <coneGeometry args={[1.1, 2.6, 4]} />
          <meshBasicMaterial color={text} />
        </mesh>
      ))}
      <FlowDots x={-5} radius={4} count={9} t={t} color={wide} speed={0.5} />
      <FlowDots x={5} radius={r} count={4} t={t} color={narrow} speed={0.14} />
      <Glow position={[5, 4, 0]} scale={26} color={narrow} opacity={0.5} />
      <pointLight position={[0, 14, 8]} color={narrow} intensity={300} distance={90} />
    </group>
  );
};

/** Paket bolak-balik antar dua node + cincin ACK. */
const Roundtrip: React.FC<{ distance: number; period: number; left: string; right: string; text: string; t: number }> = ({
  distance,
  period,
  left,
  right,
  text,
  t,
}) => {
  const h = distance / 2;
  const cyc = (t / period) % 1;
  const going = cyc < 0.5;
  const local = going ? cyc / 0.5 : (cyc - 0.5) / 0.5;
  const x = going ? -h + local * distance : h - local * distance;
  return (
    <group>
      <Node position={[-h, 4, 0]} color={left} scale={1.1} />
      <Node position={[h, 4, 0]} color={right} scale={1.1} />
      <Beam a={[-h, 4, 0]} b={[h, 4, 0]} color={text} opacity={0.28} />
      <group position={[x, 4, 0]}>
        <mesh>
          <sphereGeometry args={[1.1, 16, 16]} />
          <meshBasicMaterial color={text} />
        </mesh>
        <Glow position={[0, 0, 0]} scale={14} color={text} opacity={0.85} />
      </group>
      <Ring position={[going ? h : -h, 4, 0.4]} progress={(cyc * 4) % 1} color={right} maxRadius={9} />
      <Ring position={[going ? -h : h, 4, 0.4]} progress={(cyc * 4 + 0.5) % 1} color={left} maxRadius={9} />
      <pointLight position={[0, 12, 8]} color={text} intensity={300} distance={90} />
    </group>
  );
};

/** Satu paket hilang di tengah jalan, lalu dikirim ulang. */
const Loss: React.FC<{ color: string; retry: string; text: string; t: number }> = ({ color, retry, text, t }) => {
  const ph = (t % 3.2) / 3.2;
  const packets = [];
  for (let i = 0; i < 7; i++) {
    const local = ph - i * 0.1;
    if (local < 0 || local > 0.62) continue;
    const k = local / 0.62;
    const lost = i === 3;
    let scale = 1;
    if (lost) {
      if (k > 0.45) continue;
      if (k > 0.34) scale = 1 - (k - 0.34) / 0.11;
    }
    packets.push(
      <group key={i} position={[0, 1.6, 16 - k * 32]} scale={Math.max(0.02, scale)}>
        <Box position={[0, 0, 0]} size={[2, 1.6, 2.4]} color={lost ? text : color} glow={9} />
      </group>,
    );
  }
  const lossZ = 16 - 0.45 * 32;
  const flash = ph > 0.45 && ph < 0.62 ? 1 - (ph - 0.45) / 0.17 : 0;
  const re = ph > 0.62 ? (ph - 0.62) / 0.38 : 0;
  return (
    <group>
      <Lane x={0} width={5} length={44} color={color} opacity={0.1} />
      {packets}
      <group position={[0, 1.6, lossZ]}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[2.4, 3.1, 6]} />
          <meshBasicMaterial color={text} transparent opacity={0.35 + flash * 0.65} side={2} />
        </mesh>
        <Glow position={[0, 0, 0]} scale={16 * (0.4 + flash)} color={text} opacity={0.3 + flash * 0.6} />
      </group>
      {re > 0
        ? Array.from({ length: 5 }, (_, i) => (
            <group key={`r${i}`} position={[(i - 2) * 1.9, 1.6, 16 - re * 30]} scale={Math.min(1, re * 3)}>
              <Box position={[0, 0, 0]} size={[1.5, 1.4, 2]} color={retry} glow={8} />
            </group>
          ))
        : null}
      <pointLight position={[0, 16, 6]} color={color} intensity={320} distance={100} />
    </group>
  );
};

/** Node pusat + jari-jari ke banyak node, paket mengalir. */
const Hub: React.FC<{ o: Extract<SceneObject, { type: "hub" }>; t: number; c: ColorFn }> = ({ o, t, c }) => {
  const center: Vec3 = [0, 4, 0];
  const hub = c(o.hubColor);
  const spoke = c(o.spokeColor);
  return (
    <group>
      <Node position={center} color={hub} scale={1.3} />
      <group position={[0, 0.3, 0]} rotation-x={-Math.PI / 2}>
        <Ring position={[0, 0, 0]} progress={(t * 0.5) % 1} color={hub} maxRadius={o.radius * 0.9} thickness={0.3} />
      </group>
      {Array.from({ length: o.spokes }, (_, i) => {
        const a = (i / o.spokes) * Math.PI * 2 + Math.PI / o.spokes;
        const end: Vec3 = [Math.sin(a) * o.radius, 2, Math.cos(a) * o.radius];
        return (
          <group key={i}>
            <Node position={end} color={spoke} scale={0.6} />
            <Beam a={center} b={end} color={spoke} opacity={0.35} />
            {[0, 1, 2].map((k) => {
              const inbound = o.traffic === "in" || (o.traffic === "both" && k % 2 === 0);
              const ph = (t * 0.35 + k / 3 + i * 0.13) % 1;
              const f = inbound ? 1 - ph : ph;
              const pos: Vec3 = [0, 1, 2].map((j) => center[j] + (end[j] - center[j]) * f) as Vec3;
              return <Box key={k} position={pos} size={[0.8, 0.8, 0.8]} color={inbound ? spoke : hub} glow={5} />;
            })}
          </group>
        );
      })}
      <pointLight position={[0, 20, 10]} color={c("text")} intensity={500} distance={120} />
    </group>
  );
};

/** Tumpukan lapisan, opsional muncul satu per satu. */
const Stack: React.FC<{ layers: number; reveal: boolean; colors: string[]; t: number; wp: number }> = ({
  layers,
  reveal,
  colors,
  t,
  wp,
}) => (
  <group>
    {Array.from({ length: layers }, (_, i) => {
      const at = (i / layers) * 0.75;
      const k = reveal ? clamp01((wp - at) / 0.08) : 1;
      if (k <= 0.01) return null;
      const col = colors[i % colors.length];
      const float = Math.sin(t * 1.2 + i) * 0.12;
      return (
        <group key={i} position={[0, 1 + i * 2.6 + (1 - k) * 4 + float, 0]} scale={easeOutBack(k)}>
          <mesh>
            <boxGeometry args={[8, 1.6, 8]} />
            <meshStandardMaterial color="#0d2338" emissive={col} emissiveIntensity={0.55} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh scale={1.03}>
            <boxGeometry args={[8, 1.6, 8]} />
            <meshBasicMaterial color={col} wireframe transparent opacity={0.5} />
          </mesh>
          <Glow position={[0, 0, 0]} scale={18} color={col} opacity={0.25} />
        </group>
      );
    })}
    <pointLight position={[8, 20, 14]} color={colors[0]} intensity={400} distance={100} />
  </group>
);

/** Closing: jalur ke horizon, gelombang sinyal, partikel. */
const Horizon: React.FC<{ color: string; second: string; t: number }> = ({ color, second, t }) => {
  const wave = (t * 0.32) % 1;
  return (
    <group>
      <Lane x={-8} width={8} length={200} color={second} opacity={0.1} />
      <Lane x={6} width={3.4} length={200} color={color} opacity={0.3} />
      <Ring position={[0, 0.3, -20 - wave * 120]} progress={wave} color={color} maxRadius={40} thickness={1.2} />
      <Particles count={40} area={[120, 34, 160]} color={color} speed={1} t={t} />
      <pointLight position={[0, 30, 30]} color={color} intensity={700} distance={260} />
      <pointLight position={[0, 6, -80]} color={second} intensity={500} distance={300} />
    </group>
  );
};
