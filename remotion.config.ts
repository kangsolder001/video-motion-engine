import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setEntryPoint("src/index.ts");

// Headless Chrome di environment ini tidak punya GPU.
// `swangle` = software ANGLE, paling kompatibel untuk render three.js.
Config.setChromiumOpenGlRenderer("swangle");

// Browser Chrome yang sudah terpasang di sistem (tak perlu unduh lagi).
Config.setBrowserExecutable("/usr/bin/google-chrome");

Config.setConcurrency(null);
