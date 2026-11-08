import { Glow } from "./glow";

// ---------------------------------------------------------------------------
// Lantai grid — bahasa visual "technical environment" (spec.md §8.1)
// ---------------------------------------------------------------------------
export const GridFloor: React.FC<{
  size?: number;
  divisions?: number;
  floor?: string;
  line?: string;
  faint?: string;
}> = ({ size = 500, divisions = 50, floor = "#060f1c", line = "#1f7ba8", faint = "#114263" }) => (
  <group>
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.06, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial color={floor} />
    </mesh>
    <gridHelper
      args={[size, divisions, line, faint]}
      position={[0, -0.02, 0]}
    />
  </group>
);

// ---------------------------------------------------------------------------
// Jalur (lane) — bidang gelap dengan dua garis tepi menyala
// ---------------------------------------------------------------------------
export const Lane: React.FC<{
  x: number;
  width: number;
  length?: number;
  z?: number;
  color: string;
  opacity?: number;
}> = ({ x, width, length = 90, z = 0, color, opacity = 0.13 }) => (
  <group position={[x, 0.02, z]}>
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[width, length]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
    {[-width / 2, width / 2].map((ex) => (
      <mesh key={ex} position={[ex, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.16, length]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} />
      </mesh>
    ))}
  </group>
);

// ---------------------------------------------------------------------------
// Paket data — kubus menyala bergerak di sepanjang jalur
// ---------------------------------------------------------------------------
type PacketsProps = {
  x: number;
  laneWidth: number;
  count: number;
  /** posisi awal paket ke-0 di sumbu Z */
  baseZ: number;
  /** panjang lintasan */
  length: number;
  /** arah: +1 menuju kamera, -1 menjauh */
  dir: 1 | -1;
  /** pecahan lintasan per detik */
  speed: number;
  /** waktu absolut (detik) */
  t: number;
  color: string;
  size?: number;
  /** offset fase 0..1 agar tak menumpuk */
  seed?: number;
  /** 0..1 — bila < 1, sebagian paket menguap (simulasi packet loss) */
  lossRate?: number;
  glow?: boolean;
};

export const Packets: React.FC<PacketsProps> = ({
  x,
  laneWidth,
  count,
  baseZ,
  length,
  dir,
  speed,
  t,
  color,
  size = 1.1,
  seed = 0,
  lossRate = 0,
  glow = true,
}) => {
  const half = length / 2;
  const items = [];

  for (let i = 0; i < count; i++) {
    const phase = ((i / count + seed) % 1 + 1) % 1;
    const travelled = (phase + t * speed) % 1;
    const z = dir > 0 ? baseZ + half - travelled * length : baseZ - half + travelled * length;

    // Packet loss: paket tertentu menguap di tengah lintasan
    let scale = 1;
    let visible = true;
    if (lossRate > 0) {
      const lane = i % Math.max(1, Math.round(1 / Math.max(lossRate, 0.01)));
      if (lane === 0 && travelled > 0.42 && travelled < 0.72) visible = false;
      if (travelled > 0.42 && travelled < 0.5) {
        scale = 1 - (travelled - 0.42) / 0.08;
      }
    }
    if (!visible || scale <= 0.02) continue;

    const jitter = Math.sin(t * 3 + i) * 0.04;
    items.push(
      <group key={i} position={[x + jitter, size / 2 + 0.12, z]} scale={scale}>
        <mesh>
          <boxGeometry args={[laneWidth * 0.5, size, size * 1.5]} />
          <meshBasicMaterial color={color} />
        </mesh>
        {glow ? (
          <Glow position={[0, 0, 0]} scale={size * 4.5} color={color} opacity={0.5} />
        ) : null}
      </group>,
    );
  }

  return <group>{items}</group>;
};

// ---------------------------------------------------------------------------
// Panah arah (download / upload)
// ---------------------------------------------------------------------------
export const Arrow: React.FC<{
  position: [number, number, number];
  /** 1 = ke atas (upload), -1 = ke bawah (download) */
  sign: 1 | -1;
  color: string;
  scale?: number;
}> = ({ position, sign, color, scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh rotation-z={sign > 0 ? 0 : Math.PI}>
      <coneGeometry args={[1.5, 3.4, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
    <mesh position={[0, -3.2, 0]}>
      <boxGeometry args={[1.1, 3.4, 1.1]} />
      <meshBasicMaterial color={color} transparent opacity={0.55} />
    </mesh>
    <Glow position={[0, 0, 0]} scale={12 * scale} color={color} opacity={0.55} />
  </group>
);

// ---------------------------------------------------------------------------
// Cincin denyut — dipakai untuk RTT dan transisi
// ---------------------------------------------------------------------------
export const Ring: React.FC<{
  position: [number, number, number];
  progress: number;
  color: string;
  maxRadius?: number;
  thickness?: number;
}> = ({ position, progress, color, maxRadius = 9, thickness = 0.35 }) => {
  if (progress <= 0 || progress >= 1) return null;
  const r = 0.6 + progress * maxRadius;
  const opacity = Math.max(0, 1 - progress);
  return (
    <mesh position={position}>
      <ringGeometry args={[r, r + thickness, 48]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity * 0.9}
        side={2 /* THREE.DoubleSide */}
        depthWrite={false}
      />
    </mesh>
  );
};

// ---------------------------------------------------------------------------
// Node (perangkat / server)
// ---------------------------------------------------------------------------
export const Node: React.FC<{
  position: [number, number, number];
  color: string;
  scale?: number;
  label?: never;
}> = ({ position, color, scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh>
      <icosahedronGeometry args={[2.4, 0]} />
      <meshStandardMaterial
        color="#0b1f33"
        emissive={color}
        emissiveIntensity={0.75}
        metalness={0.6}
        roughness={0.3}
        flatShading
      />
    </mesh>
    <mesh scale={1.35}>
      <icosahedronGeometry args={[2.4, 0]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
    </mesh>
    <Glow position={[0, 0, 0]} scale={16 * scale} color={color} opacity={0.7} />
  </group>
);
