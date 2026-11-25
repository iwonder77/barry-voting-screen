// Pointer input: press feedback and taps (adapted from dino-tiles). Pointer
// Events only, listened to on window; pointerType is never checked, because
// touch may be reported as mouse.
//
// One finger presses at a time. A press on a [data-tap] element shows
// .is-pressed; drifting more than TAP_SLOP outside the element cancels it, and
// releasing inside it is a tap. A press anywhere else is a background tap
// (onTap(null)) if it stays within TAP_SLOP of where it started.
import { TAP_SLOP, STUCK_POINTER_MS } from "./config.js";
import { toStage } from "./stage.js";
import { reportError } from "./errors.js";

let stageEl = null;
let h = null; // handlers: { canPress(el), onTap(el), onActivity() }
let press = null; // { id, el, box, x0, y0, seen, ok }

// No long-press menu, image dragging or text selection. Installed first at
// boot so they hold even if something later fails.
export function installKioskGuards() {
  const prevent = (e) => e.preventDefault();
  window.addEventListener("contextmenu", prevent);
  window.addEventListener("dragstart", prevent);
  window.addEventListener("selectstart", prevent);
}

export function initInput(stage, handlers) {
  stageEl = stage;
  h = handlers;
  window.addEventListener("pointerdown", guarded(onDown));
  window.addEventListener("pointermove", guarded(onMove));
  window.addEventListener("pointerup", guarded(onUp));
  window.addEventListener("pointercancel", guarded(onCancel));
  window.addEventListener("blur", cancelPress);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelPress();
  });
}

// Drops the current press without a tap (also used when the screen changes).
export function cancelPress() {
  if (!press) return;
  if (press.el) press.el.classList.remove("is-pressed");
  press = null;
}

function guarded(fn) {
  return (e) => {
    try {
      fn(e);
    } catch (err) {
      reportError(err, "Input");
    }
  };
}

function onDown(e) {
  if (e.cancelable) e.preventDefault(); // no compatibility mouse events or selection
  h.onActivity();
  const now = performance.now();
  if (press) {
    // Another finger is pressing. Take over only if that press looks lost:
    // same id again, the browser says no other pointer is down (isPrimary),
    // or it has been silent too long.
    const lost = e.pointerId === press.id || e.isPrimary || now - press.seen > STUCK_POINTER_MS;
    if (!lost) return;
    cancelPress();
  }

  const el = e.target instanceof Element ? e.target.closest("[data-tap]") : null;
  if (!h.canPress(el)) return;

  const p = toStage(e.clientX, e.clientY);
  press = { id: e.pointerId, el, box: el ? stageBox(el) : null, x0: p.x, y0: p.y, seen: now, ok: true };
  if (el) el.classList.add("is-pressed");
  try {
    stageEl.setPointerCapture(e.pointerId); // keep receiving moves if the pointer leaves the window
  } catch {
    // pointer already gone
  }
}

function onMove(e) {
  if (!press || e.pointerId !== press.id) return;
  press.seen = performance.now();
  if (press.ok && !inside(toStage(e.clientX, e.clientY))) {
    press.ok = false; // slid off: no tap, even if it comes back
    if (press.el) press.el.classList.remove("is-pressed");
  }
}

function onUp(e) {
  h.onActivity();
  if (!press || e.pointerId !== press.id) return;
  const tap = press.ok && inside(toStage(e.clientX, e.clientY));
  const el = press.el;
  cancelPress();
  if (tap) h.onTap(el);
}

function onCancel(e) {
  if (press && e.pointerId === press.id) cancelPress();
}

// Is p (stage px) still close enough to count as a tap?
function inside(p) {
  const b = press.box;
  if (!b) return Math.hypot(p.x - press.x0, p.y - press.y0) <= TAP_SLOP;
  return (
    p.x >= b.x - TAP_SLOP &&
    p.x <= b.x + b.w + TAP_SLOP &&
    p.y >= b.y - TAP_SLOP &&
    p.y <= b.y + b.h + TAP_SLOP
  );
}

// An element's box in stage pixels.
function stageBox(el) {
  const r = el.getBoundingClientRect();
  const a = toStage(r.left, r.top);
  const b = toStage(r.right, r.bottom);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}
