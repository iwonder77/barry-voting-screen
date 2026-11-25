// On-screen keyboard layout: one array of rows per layer. In a row:
//   "a"                          a character key (letters follow Shift/Caps Lock)
//   { char, alt }                a character key; alt is typed with Shift
//   { action, label, grow }      a function key: delete, caps, shift, layer, submit
//   { gap }                      empty space
// Character keys are a fixed width; function keys, gaps and any key with
// `grow` share the rest of the row in proportion to `grow`/`gap`.
// `right: true` puts a function key's label bottom right (as in the render).
// There is no Tab key, and no key moves the cursor: typing only appends.

const DELETE = { action: "delete", label: "delete", grow: 1, right: true };
const RETURN = { action: "submit", label: "return", grow: 1, right: true };
const SPACE = { char: " ", grow: 4.2 };

export const LAYERS = {
  letters: [
    [..."qwertyuiop", DELETE],
    [{ action: "caps", label: "caps lock", grow: 1 }, ..."asdfghjkl", RETURN],
    [
      { action: "shift", label: "shift", grow: 1 },
      ..."zxcvbnm",
      { char: ",", alt: "?" },
      { char: ".", alt: "!" },
      { action: "shift", label: "shift", grow: 1, right: true },
    ],
    [
      { action: "layer", label: ",?123", grow: 1 },
      SPACE,
      { action: "layer", label: ",?123", grow: 1, right: true },
    ],
  ],
  symbols: [
    [..."1234567890", DELETE],
    [{ gap: 1 }, ..."-/:;()$&@", RETURN],
    [{ gap: 1 }, ...".,?!'\"#%+", { gap: 1 }],
    [{ action: "layer", label: "ABC", grow: 1 }, SPACE, { action: "layer", label: "ABC", grow: 1, right: true }],
  ],
};
