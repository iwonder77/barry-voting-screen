// Debug overlay (DEBUG in config.js), top right: FPS, average and worst frame
// time over the last second, then whatever info() returns (state, idle
// countdown, vote totals). Its "Reset votes" control is a normal
// data-tap="reset-votes" element, handled in main.js.
// Returns a function that redraws the info text immediately.
export function startDebug(stage, info) {
  const box = document.createElement("div");
  box.className = "debug";
  const text = document.createElement("div");
  text.className = "debug-text";
  const reset = document.createElement("div");
  reset.className = "debug-reset";
  reset.dataset.tap = "reset-votes";
  reset.innerHTML = '<div class="face">Reset votes</div>';
  box.append(text, reset);
  stage.append(box);

  let fps = "– fps";
  const draw = () => {
    text.textContent = `${fps}\n${info()}`;
  };

  // Counts requestAnimationFrame callbacks; the text changes once per second.
  let frames = 0;
  let worst = 0;
  let t0 = 0;
  let last = 0;
  const tick = (t) => {
    requestAnimationFrame(tick);
    if (!t0) {
      t0 = last = t;
      return;
    }
    frames++;
    worst = Math.max(worst, t - last);
    last = t;
    const span = t - t0;
    if (span >= 1000) {
      fps = `${Math.round((frames * 1000) / span)} fps · ${(span / frames).toFixed(1)} ms avg · ${worst.toFixed(0)} ms max`;
      frames = 0;
      worst = 0;
      t0 = t;
      draw();
    }
  };
  requestAnimationFrame(tick);
  draw();
  return draw;
}
