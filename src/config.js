// All tunable values in one place. Units are stage pixels (1080×1920) and
// milliseconds unless noted. Colors and layout live in style.css.

// Debug overlay (FPS, frame time, state, idle countdown, vote totals) and the
// "reset votes" control. Set to false for production.
export const DEBUG = true;

// Portrait stage. With the BrightSign Author presentation set to portrait, the
// page gets exactly this viewport (verified with portrait-touch-probe).
export const STAGE_W = 1080;
export const STAGE_H = 1920;

// Vote options in display order. Each id has a color token in style.css
// (--strike, --signal, --touch) and a key in the saved vote counts.
export const OPTIONS = [
  { id: "strike", label: "Strike" },
  { id: "signal", label: "Signal" },
  { id: "touch", label: "Stay in touch" },
];

// Idle timeout per state; each one returns to Home. 0 = no timeout.
// Results and Keyboard share SCREEN_TIMEOUT_MS (the original spec had 15 s
// and 45 s; lengthened/shortened after testing on the player).
export const SCREEN_TIMEOUT_MS = 25000;
export const IDLE_MS = { home: 0, results: SCREEN_TIMEOUT_MS, keyboard: SCREEN_TIMEOUT_MS, thanks: 3000 };

// Screen crossfade. Taps that start during it are ignored.
export const FADE_MS = 400;

// Results pie: revealed with opacity and scale, starting partway into the crossfade.
export const PIE_DELAY_MS = 150;
export const PIE_MS = 500;

// Keyboard: the most characters a theory can have, and from how many typed
// characters on the field shows "N characters left".
export const TEXT_LIMIT = 140;
export const COUNT_FROM = 120;

// Input
export const TAP_SLOP = 24; // a press may drift this far outside its button (or from its start) and still be a tap
export const STUCK_POINTER_MS = 5000; // a silent press this old is treated as lost (its pointerup never came)

// Loaded by path from public/. Relative: the player loads the site from file:///<Site name>/.
export const IMAGE_BARRY = "./images/barry.jpg";
