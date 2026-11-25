// Global error handler (from dino-tiles): every uncaught error or rejected
// promise is listed on screen, near the top of the stage. main.js imports this
// module first so it is installed before anything else runs.
const MAX_LINES = 6;
const lines = []; // newest first: { msg, count }
let box = null;

export function reportError(err, where = "Error") {
  const msg = `${where}: ${err && err.message ? err.message : String(err)}`;
  console.error("[barry-voting-screen]", msg, err);
  if (lines.length && lines[0].msg === msg) {
    lines[0].count++; // the same error again (e.g. every frame): count, don't flood
  } else {
    lines.unshift({ msg, count: 1 });
    if (lines.length > MAX_LINES) lines.pop();
  }
  try {
    show();
  } catch {
    // no DOM to draw into; the console line above is all we can do
  }
}

function show() {
  if (!box) {
    box = document.createElement("div");
    box.className = "errors";
    (document.getElementById("stage") || document.body).append(box);
  }
  box.textContent = lines
    .map((l) => (l.count > 1 ? `${l.msg} (×${l.count})` : l.msg))
    .join("\n");
}

window.addEventListener("error", (e) => reportError(e.error || e.message, "Script"));
window.addEventListener("unhandledrejection", (e) => reportError(e.reason, "Promise"));
