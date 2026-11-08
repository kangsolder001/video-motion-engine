import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const Smoke: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const t = frame / fps;
  const x = 100 + (width - 200) * (0.5 + 0.5 * Math.sin(t * 2));

  return (
    <AbsoluteFill
      style={{
        background: "#07111F",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 999,
          background: "#00C8FF",
          transform: `translateX(${x - width / 2}px)`,
          boxShadow: "0 0 80px #00C8FF",
        }}
      />
      <div style={{ color: "#EAF4FF", fontSize: 64, marginTop: 80 }}>
        Smoke Test {frame}
      </div>
      <div style={{ color: "#00C8FF", fontSize: 32, marginTop: 20 }}>
        {width}x{height} @ {fps}fps
      </div>
    </AbsoluteFill>
  );
};
