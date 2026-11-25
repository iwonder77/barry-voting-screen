// Vote counts, kept in localStorage. No dates: on the player localStorage is
// expected to be cleared on reboot, and power is cut every night, so counts
// start at zero each morning (README "Votes and the daily reset").
// If storage fails, counting carries on in memory and isSaved() says so.
import { OPTIONS } from "./config.js";

const KEY = "barry-voting-screen.votes";
const IDS = OPTIONS.map((o) => o.id);

let counts = zeros();
let saved = true; // did the last read or write of localStorage work?

function zeros() {
  return Object.fromEntries(IDS.map((id) => [id, 0]));
}

// Reads the saved counts. Anything missing or malformed counts as 0.
export function load() {
  counts = zeros();
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
    saved = true;
  } catch (err) {
    saved = false;
    console.warn("[barry-voting-screen] votes: localStorage unreadable", err);
  }
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    // corrupt: start from zero
  }
  for (const id of IDS) {
    const n = data && data[id];
    if (Number.isSafeInteger(n) && n > 0) counts[id] = n;
  }
  return totals();
}

export function record(option) {
  if (!IDS.includes(option)) throw new Error(`Unknown vote option "${option}"`);
  counts[option]++;
  write();
  return totals();
}

// A copy of the counts: { strike, signal, touch }.
export function totals() {
  return { ...counts };
}

export function reset() {
  counts = zeros();
  try {
    localStorage.removeItem(KEY);
    saved = true;
  } catch (err) {
    saved = false;
    console.warn("[barry-voting-screen] votes: localStorage reset failed", err);
  }
  return totals();
}

export function isSaved() {
  return saved;
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(counts));
    saved = true;
  } catch (err) {
    saved = false;
    console.warn("[barry-voting-screen] votes: not saved", err);
  }
}
