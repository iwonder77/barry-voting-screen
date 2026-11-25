// Fixed 1080×1920 portrait stage (from portrait-touch-probe). On the player the
// page is exactly 1080×1920 and touch arrives already rotated, so nothing is
// scaled. Any other window (desktop preview) is fitted and letterboxed, and
// toStage() maps pointer positions back to stage pixels.
import { STAGE_W, STAGE_H } from "./config.js";

const view = { scale: 1, ox: 0, oy: 0 };

export function fitStage(stage) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w === STAGE_W && h === STAGE_H) {
    view.scale = 1;
    view.ox = 0;
    view.oy = 0;
    stage.style.transform = "";
    return;
  }
  const s = Math.min(w / STAGE_W, h / STAGE_H);
  view.scale = s;
  view.ox = Math.round((w - STAGE_W * s) / 2);
  view.oy = Math.round((h - STAGE_H * s) / 2);
  stage.style.transform = `translate(${view.ox}px, ${view.oy}px) scale(${s})`;
}

// Client (window) coordinates -> stage pixels.
export function toStage(clientX, clientY) {
  return { x: (clientX - view.ox) / view.scale, y: (clientY - view.oy) / view.scale };
}
