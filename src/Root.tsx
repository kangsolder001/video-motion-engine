import { Composition } from "remotion";
import { Episode } from "./Episode";
import { Smoke } from "./smoke/Smoke";
import { DURATION_IN_FRAMES, FPS } from "./episode/timeline";
import { VIDEO } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Episode utama — durasi mengikuti audio TTS yang benar-benar dihasilkan */}
      <Composition
        id="Episode"
        component={Episode}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO.width}
        height={VIDEO.height}
      />

      {/* Uji pipeline (M0 checkpoint) */}
      <Composition
        id="Smoke"
        component={Smoke}
        durationInFrames={90}
        fps={FPS}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
};
