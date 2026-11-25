// Screen switching. Every screen is opaque and full-stage; the entering screen
// fades in on top of the leaving one, which is hidden when the fade ends. This
// is a true crossfade (nothing behind shows through mid-fade) and animates
// opacity only. isFading() is true until the fade ends; input ignores taps
// that start before then.
import { FADE_MS } from "./config.js";

const screens = new Map(); // state name -> [data-screen] element
let active = null;
let leaving = null;
let fade = null; // the running Animation, or null

export function initScreens(stage) {
  for (const el of stage.querySelectorAll("[data-screen]")) {
    screens.set(el.dataset.screen, el);
    if (el.classList.contains("is-active")) active = el;
  }
}

export function showScreen(name) {
  const next = screens.get(name);
  if (!next) throw new Error(`No screen for state "${name}"`);
  if (next === active) return;
  if (fade) endFade(); // switching again mid-fade: finish the old one now

  leaving = active;
  active = next;
  leaving.classList.replace("is-active", "is-leaving");
  next.classList.add("is-active");

  fade = next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: "ease-out" });
  fade.onfinish = endFade;
}

export function isFading() {
  return fade !== null;
}

function endFade() {
  if (fade) {
    fade.onfinish = null;
    fade.cancel(); // no-op once finished; mid-fade it jumps to fully shown
  }
  fade = null;
  if (leaving) leaving.classList.remove("is-leaving");
  leaving = null;
}
