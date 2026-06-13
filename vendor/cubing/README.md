# Vendored cubing.js (scramble module)

Offline copy of the **scramble** entry point of [cubing.js](https://js.cubing.net/cubing/)
— used for WCA random-state scrambles on every event, with no external/CDN dependency.

- **Source:** npm `cubing@0.63.3` (`dist/lib/cubing/`)
- **License:** MPL-2.0 OR GPL-3.0-or-later (© the js.cubing.net team) — see https://github.com/cubing/cubing.js
- **What's here:** only the transitive closure of `scramble/index.js` (29 cubing files +
  the `random-uint-below` dep under `npm/`). The WASM solvers are inlined as base64, so there
  are no separate binary assets and nothing is fetched at runtime.
- **Bare imports** (`cubing/alg`, `cubing/puzzles`, `random-uint-below`) were rewritten to
  relative paths so the module + its web worker run without an import map.
- **Regenerate:** `npm i cubing@<ver>`, recompute the closure from `scramble/index.js`, copy the
  files preserving structure, then rewrite the three bare specifiers to relative paths.

Loaded by a `<script type="module">` in `index.html` that exposes `window.wcaScramble(eventId)`.
