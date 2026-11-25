// Results screen: the legend (swatch, label, dotted leader, percentage) and an
// inline-SVG pie of today's totals filling the ring. The visitor's choice is
// highlighted in the legend only (tinted band and bold text); the pie marks no
// slice. Elements are built once and reused.
import { OPTIONS, PIE_DELAY_MS, PIE_MS } from "./config.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const IDS = OPTIONS.map((o) => o.id);
// Slice radius. The ring (index.html) is r 387 and 10 wide and drawn on top,
// so slices end 2 px under its inner edge (382): the pie fills it with no seam.
const R = 384;

const rows = new Map(); // id -> { row, pct }
const slices = new Map(); // id -> <path>
const lines = new Map(); // id -> <line>, the separator where that slice starts
let pieEl = null;
let reveal = null; // the running reveal Animation

export function initResults(legend, pie) {
  for (const o of OPTIONS) {
    const row = document.createElement("li");
    row.className = "legend-row";
    row.style.setProperty("--c", `var(--${o.id})`);
    row.innerHTML =
      '<span class="swatch"></span><span class="legend-label"></span><span class="leader"></span><span class="legend-pct"></span>';
    row.querySelector(".legend-label").textContent = o.label;
    legend.append(row);
    rows.set(o.id, { row, pct: row.querySelector(".legend-pct") });
  }

  // Draw order (index.html): slices, separators, ring.
  pieEl = pie;
  for (const o of OPTIONS) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "pie-slice");
    path.style.fill = `var(--${o.id})`;
    pie.querySelector(".pie-slices").append(path);
    slices.set(o.id, path);

    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("class", "pie-line");
    pie.querySelector(".pie-lines").append(line);
    lines.set(o.id, line);
  }
}

// counts: { strike, signal, touch }; choice: the visitor's option id or null.
export function renderResults(counts, choice) {
  const total = IDS.reduce((sum, id) => sum + counts[id], 0);
  const pct = percentages(counts);
  pieEl.classList.toggle("is-empty", total === 0); // empty ring + "Be the first to vote!"

  for (const id of IDS) {
    const { row, pct: el } = rows.get(id);
    el.textContent = pct ? `${pct[id]}%` : "–";
    row.classList.toggle("is-chosen", total > 0 && id === choice);
  }

  // Slices run clockwise from 12 o'clock in display order, sized by exact share.
  // Every boundary gets the same separator: a line from the center where each
  // drawn slice starts, or none when one slice is the whole pie.
  const drawn = IDS.filter((id) => counts[id] > 0).length;
  let a0 = 0;
  for (const id of IDS) {
    const share = total ? counts[id] / total : 0;
    const a1 = a0 + share * 2 * Math.PI;
    slices.get(id).setAttribute("d", slicePath(a0, a1, share));

    const line = lines.get(id);
    line.style.display = share > 0 && drawn > 1 ? "" : "none";
    line.setAttribute("x2", (R * Math.sin(a0)).toFixed(2));
    line.setAttribute("y2", (-R * Math.cos(a0)).toFixed(2));
    a0 = a1;
  }
}

// Fades and scales the pie in (opacity and transform only), starting partway
// into the screen crossfade.
export function revealPie() {
  if (reveal) reveal.cancel();
  reveal = pieEl.animate(
    [
      { opacity: 0, transform: "scale(0.9)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    { duration: PIE_MS, delay: PIE_DELAY_MS, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "backwards" },
  );
}

// Whole-number percentages that always add up to 100 (largest-remainder
// method): round every share down, then give the missing points to the
// largest remainders (ties go in display order). null when there are no votes.
export function percentages(counts) {
  const total = IDS.reduce((sum, id) => sum + counts[id], 0);
  if (!total) return null;
  const out = {};
  const rest = [];
  let given = 0;
  for (const id of IDS) {
    out[id] = Math.floor((counts[id] * 100) / total);
    rest.push({ id, r: (counts[id] * 100) % total }); // integer remainder, no float error
    given += out[id];
  }
  rest.sort((a, b) => b.r - a.r); // stable: equal remainders keep display order
  for (let i = 0; i < 100 - given; i++) out[rest[i].id]++;
  return out;
}

// SVG path for a slice from angle a0 to a1 (radians clockwise from 12 o'clock),
// centered on 0,0. A whole pie is a circle (an arc can't close on itself).
function slicePath(a0, a1, share) {
  if (share <= 0) return "";
  if (share >= 1) return `M0 ${-R}A${R} ${R} 0 1 1 0 ${R}A${R} ${R} 0 1 1 0 ${-R}Z`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M0 0L${point(a0)}A${R} ${R} 0 ${large} 1 ${point(a1)}Z`;
}

function point(a) {
  return `${(R * Math.sin(a)).toFixed(2)} ${(-R * Math.cos(a)).toFixed(2)}`;
}
