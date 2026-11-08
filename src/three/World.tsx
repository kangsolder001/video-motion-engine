import { COLORS } from "../theme";
import { Arrow, GridFloor, Lane, Node, Packets, Ring } from "./parts";
import { Glow } from "./glow";
import { easeInOutCubic, easeOutBack, lerp3, pulse } from "./CameraRig";

/** Jarak antar asal scene di sumbu Z — mencegah scene tumpang tindih. */
export const SCENE_GAP = 150;

export type SceneProps = {
  /** waktu absolut episode (detik) */
  t: number;
  /** progres 0..1 dalam scene ini */
  p: number;
};

/** Envelope masuk-keluar untuk crossfade antar-beat dalam satu scene. */
const env = (p: number, i0: number, i1: number, o0: number, o1: number): number => {
  if (p <= i0) return 0;
  if (p < i1) return (p - i0) / (i1 - i0);
  if (p <= o0) return 1;
  if (p < o1) return 1 - (p - o0) / (o1 - o0);
  return 0;
};

// ===========================================================================
// SC01 — HOOK: file raksasa macet di jalur sempit
// ===========================================================================
export const Scene01: React.FC<SceneProps> = ({ t, p }) => {
  const creep = Math.min(1, p * 2.2);
  const blockZ = -4 - creep * 3.5;
  const blockPulse = 1 + pulse(t, 1.6) * 0.05;

  const queue = Array.from({ length: 11 }, (_, i) => {
    const base = 1 + i * 3.0;
    // Antrean bergerak perlahan mengikuti kepala, lalu berhenti
    const z = base - creep * 3.5 + Math.sin(t * 2.2 + i * 0.6) * 0.18;
    return (
      <group key={i} position={[3, 0.72, z]}>
        <mesh>
          <boxGeometry args={[1.7, 1.3, 1.9]} />
          <meshBasicMaterial color={COLORS.electricCyan} />
        </mesh>
        <Glow position={[0, 0, 0]} scale={7} color={COLORS.electricCyan} opacity={0.45} />
      </group>
    );
  });

  return (
    <group>
      <Lane x={3} width={3.4} length={78} color={COLORS.electricCyan} />
      {/* kepala antrean: file 1 GB */}
      <group position={[3, 2.4, blockZ]} scale={blockPulse}>
        <mesh>
          <boxGeometry args={[4.6, 4.2, 6.6]} />
          <meshStandardMaterial
            color="#0d2338"
            emissive={COLORS.electricCyan}
            emissiveIntensity={0.7}
            metalness={0.7}
            roughness={0.25}
          />
        </mesh>
        <mesh scale={1.06}>
          <boxGeometry args={[4.6, 4.2, 6.6]} />
          <meshBasicMaterial color={COLORS.electricCyan} wireframe transparent opacity={0.45} />
        </mesh>
        <Glow position={[0, 0, 0]} scale={24} color={COLORS.electricCyan} opacity={0.4} />
      </group>

      {queue}

      {/* beberapa paket yang berhasil lolos, merayap menjauh */}
      {[0, 1, 2].map((i) => (
        <group key={`f${i}`} position={[3, 0.7, -22 - i * 9 - ((t * 1.6) % 9)]}>
          <mesh>
            <boxGeometry args={[1.7, 1.3, 1.9]} />
            <meshBasicMaterial color={COLORS.techBlue} transparent opacity={0.75} />
          </mesh>
          <Glow position={[0, 0, 0]} scale={7} color={COLORS.techBlue} opacity={0.4} />
        </group>
      ))}

      <pointLight position={[3, 14, 4]} color={COLORS.electricCyan} intensity={220} distance={80} />
    </group>
  );
};

// ===========================================================================
// SC02 — CONTEXT: dua jalur asimetris
// ===========================================================================
export const Scene02: React.FC<SceneProps> = ({ t }) => (
  <group>
    <Lane x={-7} width={9} length={110} color={COLORS.techBlue} opacity={0.16} />
    <Lane x={5.5} width={3.2} length={110} color={COLORS.electricCyan} />

    {/* download: lebar & cepat, menuju kamera */}
    <Packets
      x={-7}
      laneWidth={9}
      count={20}
      baseZ={0}
      length={110}
      dir={1}
      speed={0.42}
      t={t}
      color={COLORS.techBlue}
      size={1.7}
      seed={0.1}
    />
    {/* upload: sempit & lambat, menjauh */}
    <Packets
      x={5.5}
      laneWidth={3.2}
      count={9}
      baseZ={0}
      length={110}
      dir={-1}
      speed={0.055}
      t={t}
      color={COLORS.electricCyan}
      size={1.4}
      seed={0.55}
    />

    <Arrow position={[-7, 9, -6]} sign={-1} color={COLORS.techBlue} scale={1.5} />
    <Arrow position={[5.5, 9, -6]} sign={1} color={COLORS.electricCyan} scale={1.3} />

    <pointLight position={[0, 26, 10]} color={COLORS.iceWhite} intensity={400} distance={160} />
    <pointLight position={[-20, 8, 10]} color={COLORS.techBlue} intensity={220} distance={120} />
  </group>
);

// ===========================================================================
// SC03 — EXPLANATION: tiga penyebab (beat A/B/C crossfade)
// ===========================================================================
const FlowDots: React.FC<{
  x: number;
  radius: number;
  count: number;
  t: number;
  color: string;
  speed: number;
}> = ({ x, radius, count, t, color, speed }) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const phase = (i / count + t * speed) % 1;
      const z = 14 - phase * 28;
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

const BeatA_Bandwidth: React.FC<{ a: number; t: number }> = ({ a, t }) => {
  if (a <= 0.01) return null;
  // radius jalur upload menyempit dari 4.0 -> 1.4
  const shrink = 4 - 2.6 * easeInOutCubic(Math.min(1, t * 0 + a));
  return (
    <group scale={easeOutBack(Math.min(1, a))} position={[0, 0, 0]}>
      <mesh position={[-5, 4, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[4, 4, 30, 28, 1, true]} />
        <meshBasicMaterial color={COLORS.techBlue} wireframe transparent opacity={0.55} />
      </mesh>
      <mesh position={[5, 4, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[shrink, shrink, 30, 28, 1, true]} />
        <meshBasicMaterial color={COLORS.electricCyan} wireframe transparent opacity={0.85} />
      </mesh>
      {/* isyarat penyempitan */}
      <mesh position={[5 + shrink + 2.4, 4, 0]} rotation-z={-Math.PI / 2}>
        <coneGeometry args={[1.1, 2.6, 4]} />
        <meshBasicMaterial color={COLORS.iceWhite} />
      </mesh>
      <mesh position={[5 - shrink - 2.4, 4, 0]} rotation-z={Math.PI / 2}>
        <coneGeometry args={[1.1, 2.6, 4]} />
        <meshBasicMaterial color={COLORS.iceWhite} />
      </mesh>
      <FlowDots x={-5} radius={4} count={9} t={t} color={COLORS.techBlue} speed={0.5} />
      <FlowDots x={5} radius={shrink} count={4} t={t} color={COLORS.electricCyan} speed={0.14} />
      <Glow position={[5, 4, 0]} scale={26} color={COLORS.electricCyan} opacity={0.5} />
    </group>
  );
};

const BeatB_Latency: React.FC<{ a: number; t: number }> = ({ a, t }) => {
  if (a <= 0.01) return null;
  // denyut bolak-balik: 1 siklus = 1.6 detik
  const cyc = (t * 0.625) % 1;
  const going = cyc < 0.5;
  const local = going ? cyc / 0.5 : (cyc - 0.5) / 0.5;
  const x = going ? -7 + local * 14 : 7 - local * 14;
  const arrived = going ? local > 0.97 : local > 0.97;

  return (
    <group scale={easeOutBack(Math.min(1, a))}>
      <Node position={[-7, 4, 0]} color={COLORS.techBlue} scale={1.1} />
      <Node position={[7, 4, 0]} color={COLORS.electricCyan} scale={1.1} />

      {/* jejak lintasan */}
      <mesh position={[0, 4, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.08, 0.08, 14, 6]} />
        <meshBasicMaterial color={COLORS.iceWhite} transparent opacity={0.28} />
      </mesh>

      {/* paket yang sedang menempuh perjalanan */}
      <group position={[x, 4, 0]}>
        <mesh>
          <sphereGeometry args={[1.1, 16, 16]} />
          <meshBasicMaterial color={COLORS.iceWhite} />
        </mesh>
        <Glow position={[0, 0, 0]} scale={14} color={COLORS.iceWhite} opacity={0.85} />
      </group>

      {/* cincin tanda terima (ACK) */}
      <Ring
        position={[going ? 7 : -7, 4, 0.4]}
        progress={(cyc * 4) % 1}
        color={COLORS.electricCyan}
        maxRadius={9}
      />
      <Ring
        position={[going ? -7 : 7, 4, 0.4]}
        progress={(cyc * 4 + 0.5) % 1}
        color={COLORS.techBlue}
        maxRadius={9}
      />
      {arrived ? null : null}
      <pointLight position={[0, 12, 8]} color={COLORS.iceWhite} intensity={300} distance={90} />
    </group>
  );
};

const BeatC_Loss: React.FC<{ a: number; t: number }> = ({ a, t }) => {
  if (a <= 0.01) return null;
  const CYCLE = 3.2;
  const ph = (t % CYCLE) / CYCLE;

  const packets = [];
  // paket normal berjalan dari z=+16 ke z=-16
  for (let i = 0; i < 7; i++) {
    const start = i * 0.1;
    const local = ph - start;
    if (local < 0 || local > 0.62) continue;
    const k = local / 0.62;
    const z = 16 - k * 32;
    // paket ke-3 menguap di tengah
    const isLost = i === 3;
    let scale = 1;
    if (isLost) {
      if (k > 0.45 && k < 0.62) continue;
      if (k > 0.34) scale = 1 - (k - 0.34) / 0.11;
    }
    packets.push(
      <group key={i} position={[0, 1.6, z]} scale={Math.max(0.02, scale)}>
        <mesh>
          <boxGeometry args={[2, 1.6, 2.4]} />
          <meshBasicMaterial color={isLost ? COLORS.iceWhite : COLORS.electricCyan} />
        </mesh>
        <Glow position={[0, 0, 0]} scale={9} color={COLORS.electricCyan} opacity={0.55} />
      </group>,
    );
  }

  // titik di mana paket hilang
  const lossZ = 16 - 0.45 * 32;
  const flash = ph > 0.45 && ph < 0.62 ? 1 - (ph - 0.45) / 0.17 : 0;

  // burst retransmisi setelah kehilangan
  const retrans = ph > 0.62 && ph < 1 ? (ph - 0.62) / 0.38 : 0;

  return (
    <group scale={easeOutBack(Math.min(1, a))}>
      <Lane x={0} width={5} length={44} color={COLORS.electricCyan} opacity={0.1} />
      {packets}

      {/* penanda kehilangan */}
      <group position={[0, 1.6, lossZ]}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[2.4, 3.1, 6]} />
          <meshBasicMaterial color={COLORS.iceWhite} transparent opacity={0.35 + flash * 0.65} side={2} />
        </mesh>
        <Glow position={[0, 0, 0]} scale={16 * (0.4 + flash)} color={COLORS.iceWhite} opacity={0.3 + flash * 0.6} />
      </group>

      {/* burst paket ulang */}
      {retrans > 0
        ? Array.from({ length: 5 }, (_, i) => (
            <group
              key={`r${i}`}
              position={[(i - 2) * 1.9, 1.6, 16 - retrans * 30]}
              scale={Math.min(1, retrans * 3)}
            >
              <mesh>
                <boxGeometry args={[1.5, 1.4, 2]} />
                <meshBasicMaterial color={COLORS.techBlue} />
              </mesh>
              <Glow position={[0, 0, 0]} scale={8} color={COLORS.techBlue} opacity={0.5} />
            </group>
          ))
        : null}

      <pointLight position={[0, 16, 6]} color={COLORS.electricCyan} intensity={320} distance={100} />
    </group>
  );
};

export const Scene03: React.FC<SceneProps> = ({ t, p }) => {
  // Crossfade tiga beat
  const a = env(p, 0.0, 0.05, 0.28, 0.35);
  const b = env(p, 0.3, 0.37, 0.6, 0.67);
  const c = env(p, 0.62, 0.69, 2, 3);

  return (
    <group>
      <BeatA_Bandwidth a={a} t={t} />
      <BeatB_Latency a={b} t={t} />
      <BeatC_Loss a={c} t={t} />
    </group>
  );
};

// ===========================================================================
// SC04 — VISUAL REVEAL: perbandingan tiga jalur
// ===========================================================================
export const Scene04: React.FC<SceneProps> = ({ t }) => (
  <group>
    {/* jalur 1 — lebar, lancar */}
    <Lane x={-13} width={7} length={96} color={COLORS.techBlue} opacity={0.16} />
    <Packets
      x={-13}
      laneWidth={7}
      count={26}
      baseZ={0}
      length={96}
      dir={-1}
      speed={0.4}
      t={t}
      color={COLORS.techBlue}
      size={1.5}
      seed={0.2}
    />

    {/* jalur 2 — sempit, menumpuk */}
    <Lane x={0} width={3} length={96} color={COLORS.electricCyan} />
    <Packets
      x={0}
      laneWidth={3}
      count={14}
      baseZ={0}
      length={96}
      dir={-1}
      speed={0.06}
      t={t}
      color={COLORS.electricCyan}
      size={1.5}
      seed={0.6}
    />

    {/* jalur 3 — kehilangan paket */}
    <Lane x={13} width={5.5} length={96} color={COLORS.iceWhite} opacity={0.1} />
    <Packets
      x={13}
      laneWidth={5.5}
      count={18}
      baseZ={0}
      length={96}
      dir={-1}
      speed={0.22}
      t={t}
      color={COLORS.iceWhite}
      size={1.4}
      seed={0.85}
      lossRate={0.34}
      glow={false}
    />

    {/* penanda jalur bermasalah */}
    {[0, 1, 2].map((i) => (
      <Ring
        key={i}
        position={[13, 0.4, -30 + i * 30]}
        progress={((t * 0.45 + i * 0.33) % 1)}
        color={COLORS.iceWhite}
        maxRadius={7}
        thickness={0.25}
      />
    ))}

    <pointLight position={[0, 40, 20]} color={COLORS.iceWhite} intensity={900} distance={240} />
    <pointLight position={[-40, 20, 0]} color={COLORS.techBlue} intensity={500} distance={200} />
  </group>
);

// ===========================================================================
// SC05 — CLOSING: tarik keluar ke horizon
// ===========================================================================
export const Scene05: React.FC<SceneProps> = ({ t }) => {
  const wave = (t * 0.32) % 1;
  return (
    <group>
      <Lane x={-8} width={8} length={200} color={COLORS.techBlue} opacity={0.1} />
      <Lane x={6} width={3.4} length={200} color={COLORS.electricCyan} opacity={0.3} />

      {/* denyut sinyal menjauh ke horizon */}
      <Ring position={[0, 0.3, -20 - wave * 120]} progress={wave} color={COLORS.electricCyan} maxRadius={40} thickness={1.2} />

      {/* partikel naik */}
      {Array.from({ length: 40 }, (_, i) => {
        const seed = i * 0.6180339887;
        const x = ((seed * 137.5) % 1) * 120 - 60;
        const z = ((seed * 71.3) % 1) * 160 - 120;
        const y = (((t * 0.9 + seed * 10) % 1) * 34);
        return (
          <mesh key={i} position={[x, y, z]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshBasicMaterial color={COLORS.electricCyan} transparent opacity={0.5} />
          </mesh>
        );
      })}

      <pointLight position={[0, 30, 30]} color={COLORS.electricCyan} intensity={700} distance={260} />
      <pointLight position={[0, 6, -80]} color={COLORS.techBlue} intensity={500} distance={300} />
    </group>
  );
};

// ===========================================================================
// Registry
// ===========================================================================
export const SCENE_COMPONENTS: Array<React.FC<SceneProps>> = [
  Scene01,
  Scene02,
  Scene03,
  Scene04,
  Scene05,
];

export { lerp3 };
