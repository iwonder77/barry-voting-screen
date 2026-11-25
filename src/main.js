// Boot and wiring. errors.js is imported first so its handlers are in place
// before any other module runs.
import { reportError } from "./errors.js";
import "./style.css";
import { DEBUG, IDLE_MS, IMAGE_BARRY, OPTIONS } from "./config.js";
import { fitStage } from "./stage.js";
import { installKioskGuards, initInput, cancelPress } from "./input.js";
import * as flow from "./state.js";
import * as votes from "./votes.js";
import { initScreens, showScreen, isFading } from "./screens.js";
import { buildVoteButtons } from "./home.js";
import { initResults, renderResults, revealPie } from "./results.js";
import { armIdle, noteActivity, idleLeft } from "./idle.js";
import { startDebug } from "./debug.js";

let choice = null; // this visitor's vote, highlighted on Results
let redrawDebug = () => {};

function boot() {
  installKioskGuards();
  const stage = document.getElementById("stage");

  fitStage(stage);
  window.addEventListener("resize", () => fitStage(stage));

  // Set here, not in index.html, so the build leaves the image a separate file.
  for (const img of stage.querySelectorAll("img.barry")) img.src = IMAGE_BARRY;
  buildVoteButtons(document.getElementById("vote-buttons"));
  initResults(document.getElementById("legend"), document.getElementById("pie"));
  initScreens(stage);
  votes.load();

  flow.onChange(enter);
  if (DEBUG) redrawDebug = startDebug(stage, debugInfo);
  initInput(stage, { canPress, onTap, onActivity: noteActivity });
}

// Runs after every transition in state.js.
function enter(to, from, event, data) {
  try {
    if (event === "vote") {
      choice = data;
      votes.record(choice);
    }
    if (to === "home") choice = null;
    if (to === "results") {
      renderResults(votes.totals(), choice);
      revealPie();
    }
  } finally {
    // Always switch screens and arm the timeout, so an error can't strand the kiosk.
    cancelPress();
    showScreen(to);
    armIdle(IDLE_MS[to], () => flow.send("idle"));
    redrawDebug();
  }
}

// A press that starts during a screen fade is ignored; the debug control always works.
function canPress(el) {
  return (el && el.dataset.tap === "reset-votes") || !isFading();
}

// data-tap values are flow events, except "reset-votes". A tap on no button is
// "dismiss" (Results -> Home); states that don't list an event ignore it.
function onTap(el) {
  const action = el ? el.dataset.tap : "dismiss";
  if (action === "reset-votes") resetVotes();
  else if (action === "vote") flow.send("vote", el.dataset.option);
  else flow.send(action);
}

function resetVotes() {
  votes.reset();
  if (flow.getState() === "results") renderResults(votes.totals(), choice);
  redrawDebug();
}

function debugInfo() {
  const left = idleLeft();
  const idle = left === null ? "no timeout" : `home in ${Math.ceil(left / 1000)} s`;
  const t = votes.totals();
  const counts = OPTIONS.map((o) => `${o.id} ${t[o.id]}`).join(" · ");
  return `${flow.getState()} · ${idle}\n${counts} · ${votes.isSaved() ? "saved" : "NOT SAVED"}`;
}

try {
  boot();
} catch (err) {
  reportError(err, "Startup");
}
