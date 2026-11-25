// Keyboard screen (design Screen 3): a text field and an on-screen keyboard
// built once from LAYERS (keyboard-layout.js).
//
// Typing only appends, up to TEXT_LIMIT characters; Delete removes the last
// one; the caret blinks at the end. Shift capitalizes the next character only,
// Caps Lock toggles, the layer key switches between letters and numbers/
// punctuation. Return or the Submit bar submits, if anything has been typed.
// The text exists only in this module's `text` and the field's DOM: it is
// never stored or logged, and resetKeyboard() discards it.
import { TEXT_LIMIT, COUNT_FROM } from "./config.js";
import { LAYERS } from "./keyboard-layout.js";

let text = "";
let shift = false; // one-shot: applies to the next character
let caps = false;
let layer = "letters";

let screenEl = null;
let kbEl = null;
let scrollEl = null; // the field's text area, scrolled to keep the end in view
let typedEl = null;
let caretEl = null;
let countEl = null;
let onSubmit = null;
const layerEls = new Map(); // layer name -> element
const shiftKeys = [];
const capsKeys = [];

export function initKeyboard(screen, submit) {
  screenEl = screen;
  kbEl = screen.querySelector(".kb");
  scrollEl = screen.querySelector(".field-text");
  typedEl = screen.querySelector(".typed");
  caretEl = screen.querySelector(".caret");
  countEl = screen.querySelector(".kb-count");
  onSubmit = submit;

  for (const [name, rows] of Object.entries(LAYERS)) {
    const layerEl = div("kb-layer");
    for (const row of rows) {
      const rowEl = div("kb-row");
      for (const k of row) rowEl.append(buildKey(typeof k === "string" ? { char: k } : k));
      layerEl.append(rowEl);
    }
    kbEl.append(layerEl);
    layerEls.set(name, layerEl);
  }
  resetKeyboard();
}

// Back to an empty field and the letters layer. Called on entering and leaving
// the Keyboard state, so nothing typed outlives a visit.
export function resetKeyboard() {
  text = "";
  shift = false;
  caps = false;
  layer = "letters";
  render();
}

// A tap on a key or the Submit bar (data-tap="key").
export function pressKey(el) {
  const { char, alt, action } = el.dataset;
  if (char !== undefined) type(char, alt);
  else if (action === "delete") text = text.slice(0, -1);
  else if (action === "shift") shift = !shift;
  else if (action === "caps") caps = !caps;
  else if (action === "layer") {
    layer = layer === "letters" ? "symbols" : "letters";
    shift = false;
  } else if (action === "submit") {
    if (text.trim()) onSubmit(); // main.js moves on; resetKeyboard() discards the text
    return;
  }
  render();
}

function type(char, alt) {
  if (text.length >= TEXT_LIMIT) return; // the counter says the limit is reached
  if (shift && alt) char = alt;
  else if (layer === "letters" && (shift || caps)) char = char.toUpperCase();
  text += char;
  shift = false;
}

function render() {
  typedEl.textContent = text;
  screenEl.classList.toggle("is-empty", !text.trim()); // dims Return and Submit
  kbEl.classList.toggle("is-upper", layer === "letters" && (shift || caps));
  kbEl.classList.toggle("is-shift", shift);
  for (const k of shiftKeys) k.classList.toggle("is-on", shift);
  for (const k of capsKeys) k.classList.toggle("is-on", caps);
  for (const [name, el] of layerEls) el.classList.toggle("is-hidden", name !== layer);

  const left = TEXT_LIMIT - text.length;
  countEl.textContent = left > 0 ? `${left} characters left` : "Character limit reached";
  countEl.classList.toggle("is-hidden", text.length < COUNT_FROM);

  scrollEl.scrollTop = scrollEl.scrollHeight; // past three lines, show the newest
  for (const a of caretEl.getAnimations()) a.currentTime = 0; // solid while typing, then blink
}

function buildKey(k) {
  if (k.gap) {
    const gap = div("kb-gap");
    gap.style.flex = `${k.gap} 1 0`;
    return gap;
  }
  const key = div("key");
  key.dataset.tap = "key";
  key.dataset.rollover = ""; // a second finger commits this key (input.js)
  const face = div("face");
  key.append(face);
  if (k.grow) key.style.flex = `${k.grow} 1 0`;

  if (k.action) {
    key.dataset.action = k.action;
    key.classList.add("key-fn");
    if (k.right) key.classList.add("key-right");
    const label = document.createElement("span");
    label.textContent = k.label;
    face.append(label);
    if (k.action === "shift") shiftKeys.push(key);
    if (k.action === "caps") capsKeys.push(key);
    if (k.action === "submit") key.classList.add("key-submit");
    return key;
  }

  key.dataset.char = k.char;
  if (k.alt) {
    // Shifted character above the base one, as in the render.
    key.dataset.alt = k.alt;
    key.classList.add("key-dual");
    const top = document.createElement("span");
    top.className = "key-alt";
    top.textContent = k.alt;
    const base = document.createElement("span");
    base.textContent = k.char;
    face.append(top, base);
  } else {
    if (/[a-z]/.test(k.char)) key.classList.add("key-letter");
    face.textContent = k.char;
  }
  return key;
}

function div(className) {
  const el = document.createElement("div");
  el.className = className;
  return el;
}
