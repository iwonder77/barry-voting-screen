// Visitor flow (README "Visitor flow"). Every transition is in FLOW: an event
// the current state doesn't list is ignored. Listeners run after each
// transition with (to, from, event, data).
const FLOW = {
  home: { vote: "results" },
  results: { theory: "keyboard", dismiss: "home", idle: "home" },
  keyboard: { back: "results", submit: "thanks", idle: "home" }, // back: phase 1 placeholder only
  thanks: { idle: "home" },
};

let current = "home";
const listeners = [];

export function getState() {
  return current;
}

export function onChange(fn) {
  listeners.push(fn);
}

// Returns true if the event applied to the current state.
export function send(event, data) {
  const to = FLOW[current][event];
  if (!to) return false;
  const from = current;
  current = to;
  for (const fn of listeners) fn(to, from, event, data);
  return true;
}
