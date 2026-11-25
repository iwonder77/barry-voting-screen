# barry-voting-screen

A portrait touch kiosk for a museum exhibit. Visitors vote on what Barry the Barosaurus used his tail for (strike, signal, or stay in touch), then see the day's results as a pie chart. They can also type their own theory on an on-screen keyboard; typed theories are discarded on submit.

Plain JavaScript (no framework). Vite is used only as a dev server and packager.

## Visitor flow

| Screen                       | What the visitor sees                                                              | Leaves when                            | Goes to                          |
| ---------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------- |
| Home (design Screen 1)       | The question and three vote buttons                                                | A vote button is tapped                | Results                          |
| Results (Screen 2)           | Today's totals as a pie chart, their choice highlighted, percentages in the legend | 25 s pass, or a tap outside the button | Home                             |
|                              |                                                                                    | "Submit your own theory" is tapped     | Keyboard                         |
| Keyboard (Screen 3, phase 2) | Text field and on-screen keyboard                                                  | Submit                                 | Thank-you (about 3 s), then Home |
|                              |                                                                                    | 45 s with no key press                 | Home, text cleared               |

Home doubles as the attract state. Showing Results after each vote limits each visitor to one vote per visit.

## Target platform

|                    |                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Player             | BrightSign LS445 (Series 5)                                                                            |
| OS                 | BrightSign OS 9.1.173                                                                                  |
| Browser engine     | Chromium 120 (Electron 28 build)                                                                       |
| Screen             | 1920×1080 panel mounted vertically; the app is laid out at **1080×1920**                               |
| Orientation        | Set to portrait in the BrightSign Author presentation (verified with the portrait touch probe project) |
| Touch              | USB touchscreen; touch coordinates verified correct in portrait                                        |
| Network at runtime | None. Everything ships with the app.                                                                   |
| Power              | Cut every night; the player boots fresh each morning                                                   |

## Requirements (Mac)

- **Node.js** (current LTS) and npm
- **Poppler**, for preparing designer PDFs: `brew install poppler`
- **BrightSign Author**, for publishing to the player
- **Google Chrome**, for remote debugging via `chrome://inspect`

## Quick start

```bash
npm install
npm run dev            # develop at http://localhost:5173
npm run build:player   # package for the player -> dist-player/
```

| Script                 | What it does                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run dev`          | Dev server with live reload. Also reachable by the player in URL mode.                           |
| `npm run build:player` | Single-file build for the player, in `dist-player/`. **The only build that runs on the player.** |
| `npm run build`        | Standard Vite build, in `dist/`. Desktop testing only; it fails on the player.                   |
| `npm run preview`      | Serves `dist/` locally.                                                                          |
| `npm run design`       | Renders designer PDFs as reference images and extracts their embedded images.                    |

## Project structure

```
barry-voting-screen/
├── design/
│   ├── pdf/          designer PDFs, exactly as received (committed)
│   ├── renders/      each screen rendered 1080 px wide, the layout reference (committed)
│   └── extracted/    images pulled from the PDFs (not committed)
├── public/
│   └── images/       images loaded by the app, e.g. barry.jpg
├── scripts/
│   └── extract-design.sh
├── src/
│   ├── fonts/        bundled font files and their license
│   ├── config.js     every tunable value: DEBUG, options, idle timeouts, fade and pie timing, tap slop
│   ├── main.js       boot and wiring: taps -> state events, state changes -> screens, idle, votes
│   ├── state.js      the visitor flow as one transition table (home, results, keyboard, thanks)
│   ├── votes.js      vote counts in localStorage: load(), record(), totals(), reset()
│   ├── screens.js    crossfade between screens; taps are ignored until it ends
│   ├── home.js       vote buttons
│   ├── results.js    legend, pie and largest-remainder percentages
│   ├── keyboard.js   text field and on-screen keyboard: typing, Shift, Caps Lock, layers, submit
│   ├── keyboard-layout.js  the keyboard's keys, as one array of rows per layer
│   ├── stage.js      1080×1920 stage, desktop-preview scaling, pointer -> stage coords
│   ├── input.js      pointer handling: press, tap, kiosk guards
│   ├── idle.js       the one idle timer
│   ├── debug.js      FPS overlay and "reset votes"
│   ├── errors.js     on-screen error display
│   └── style.css     design tokens and layout
├── index.html        one section per screen
└── vite.config.js
```

## Design assets

1. Put the designer PDFs in `design/pdf/` and run `npm run design`. It prints each PDF's embedded images with their sizes.
2. Prepare the dinosaur: it's the 1488×1057 JPEG shared by all three screens. Resize it to the screen width:
   ```bash
   mkdir -p public/images
   sips --resampleWidth 1080 design/extracted/voting-screen-1/img-001.jpg --out public/images/barry.jpg
   ```
3. Fonts: the design uses Myriad Variable Concept from Adobe Fonts, which is **not licensed** for apps or offline kiosks. Until a kiosk license is bought, or the designers choose a licensed alternative, the app uses **Fira Sans Condensed** (SIL Open Font License, from Google Fonts), Regular and Bold, in `src/fonts/` along with its `OFL.txt`. Never extract fonts from the PDFs.
4. The grid background is rebuilt in CSS; the backgrounds embedded in the PDFs are too low-resolution.

The designs are 2:3 (864×1296 pt) while the screen is 9:16, so about 300 px of height is laid out by us until 1080×1920 artboards arrive.

### Design tokens (sampled at 1080 px wide)

| Role                             | Value                                                                |
| -------------------------------- | -------------------------------------------------------------------- |
| Strike / Signal / Stay in touch  | `#7257a9` / `#576ea9` / `#5790a9`                                    |
| Image area                       | `#ffffff`                                                            |
| Home panel (slate)               | `#617784`, grid lines `#80939f`                                      |
| Results background (navy)        | `#012f47`, grid lines `#235169`                                      |
| Keyboard background, legend text | `#01243a`                                                            |
| Keyboard upper band              | `#395465`                                                            |
| Borders, pie ring, divider       | `#c2d2d8`                                                            |
| Button fills                     | white at ~17% (Home), ~12% (Results button, keys), ~29% (submit bar) |
| Grid                             | lines ~98.5 px apart, ~4 px thick                                    |

## Votes and the daily reset

Vote counts live in `localStorage`. On the player, `localStorage` is expected to survive page reloads but be cleared when the player reboots, because BrightSign Author sets no HTML storage path. Since power is cut every night, the counts start at zero each morning. There is no date logic.

Verify this on the player after any change to the presentation: vote a few times, reload the page from the inspector (counts should stay), then reboot (counts should reset). If counts survive a reboot, the reset assumption is broken.

On the Mac, `localStorage` persists, so debug mode has a control to reset the counts.

## Deploying to the player

1. Run `npm run build:player`.
2. In BrightSign Author, set up the presentation: orientation **portrait**, one full-screen zone, and an HTML5 state pointing at `dist-player/index.html` as a Local Site. Follow the portrait probe project's notes for the exact settings.
3. In the HTML5 state:
   - Turn on **Enable mouse and touch events**.
   - Leave **Enable Node.js** off.
   - Turn on **Enable JavaScript console** only while debugging.
4. Publish to the development SD card. Keep the setup/recovery card separate.

## Debugging on the player

- **Diagnostic Web Server (DWS):** `https://brightsign-<serial>.local`, user `admin`.
- **Web Inspector:** enable Chromium debugging in the DWS and the JavaScript console in the HTML5 state, then open `chrome://inspect` and add `<player-ip>:2999`.
- **SSH:** `ssh brightsign@brightsign-<serial>.local` opens the player's console (not a Linux shell).

## Platform quirks

All measured on the LS445.

- **Module scripts can't load as separate files.** BrightSign Author's local site serves files with no MIME type, so `build:player` inlines JS and CSS into `index.html`.
- **Always use relative paths: `./images/x.jpg`, never `/images/x.jpg`.** The page loads from `file:///<Site name>//index.html`, so a leading slash breaks only on the player.
- **Images go in `public/`** (copied as separate files). **Fonts go in `src/fonts/`**, so they're inlined into the build and available at first paint.
- **Raster images loaded by path work.** SVG files loaded by path are untested and likely fail, so use inline SVG.
- **Opening `dist*/index.html` directly on the Mac is not a valid test.** Develop with `npm run dev` and confirm on the player.
- **Target Chromium 120.** `build.target` only controls JavaScript syntax; check CSS features and APIs too.
- **Lowercase, hyphenated filenames.**

## Performance and input rules (LS445)

- Animate only `transform` and `opacity`. Avoid `backdrop-filter`, large blurs, and animated `box-shadow`. Any other animation, such as a pie sweep, must be short and measured on the player.
- A full 1080×1920 image takes about 8.3 MB once decoded.
- Reuse DOM elements rather than recreating them.
- Pointer Events only; never branch on `pointerType`. Kiosk guards: `touch-action: none`, `user-select: none`, block the long-press context menu.
- Every screen needs a way out, and every timeout returns to Home.
- Turn the JavaScript console off for production.

## Open design questions

- 1080×1920 artboards and full-resolution backgrounds from the designers.
- Final font and its kiosk license.
- How the visitor's choice is highlighted on the Results screen.
- What the pie shows before the first vote of the day (currently an empty ring with "Be the first to vote!").
- Thank-you message wording after a typed theory is submitted.
