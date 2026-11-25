// The one idle timer. Each state arms it with its own timeout (IDLE_MS in
// config.js); any touch restarts it; it fires once, then waits to be re-armed.
let timer = 0;
let ms = 0; // current timeout; 0 = disarmed
let deadline = 0;
let onIdle = null;

export function armIdle(duration, fn) {
  ms = duration;
  onIdle = fn;
  restart();
}

export function noteActivity() {
  if (ms) restart();
}

// Milliseconds until the timeout fires, or null when disarmed (debug overlay).
export function idleLeft() {
  return ms ? Math.max(0, deadline - performance.now()) : null;
}

function restart() {
  clearTimeout(timer);
  timer = 0;
  if (!ms) return;
  deadline = performance.now() + ms;
  timer = setTimeout(fire, ms);
}

function fire() {
  timer = 0;
  ms = 0;
  if (onIdle) onIdle();
}
