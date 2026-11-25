// Home screen: the three vote buttons, built once from OPTIONS. The outer
// element is the hit area and carries the attract motion; the inner .face
// carries the pressed state, so the two transforms never fight.
import { OPTIONS } from "./config.js";

export function buildVoteButtons(container) {
  OPTIONS.forEach((o, i) => {
    const btn = document.createElement("div");
    btn.className = "vote";
    btn.dataset.tap = "vote";
    btn.dataset.option = o.id;
    btn.style.setProperty("--i", i); // staggers the attract motion

    const face = document.createElement("div");
    face.className = "face";
    face.textContent = o.label;

    btn.append(face);
    container.append(btn);
  });
}
