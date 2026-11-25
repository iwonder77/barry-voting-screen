import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Two builds from one project:
//   npm run build         -> dist/         standard Vite output (does NOT run on the player)
//   npm run build:player  -> dist-player/  JS, CSS, and fonts inlined into index.html (runs on the player)
export default defineConfig(({ mode }) => ({
  base: "./", // relative paths: the player loads the site from file:///<Site name>/
  build: {
    target: "chrome120", // the player's Chromium version (BOS 9.1)
    outDir: mode === "player" ? "dist-player" : "dist",
  },
  server: { host: true }, // lets the player reach `npm run dev` in URL mode
  plugins: mode === "player" ? [viteSingleFile()] : [],
}));
