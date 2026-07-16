# AGENTS.md

## Cursor Cloud specific instructions

### Project layout
- All project files live in `bridge-horror-house/` (not the repo root). Run all `npm` commands from that directory.
- **Bridge Horror House** is a purely client-side WebGL game (Vite + vanilla JS + Three.js). There is no backend, database, or external service — the browser is the entire runtime.

### Running the app
- Dev server: `npm run dev` (Vite, serves at `http://localhost:5180`). Standard commands are in `bridge-horror-house/package.json` and `README.md`.
- Build/preview: `npm run build` then `npm run preview`.
- To play: open `http://localhost:5180`, click **Enter**, then click the canvas to lock the mouse pointer. Controls: `WASD` move, mouse look, `F` flashlight, `E` interact, hold left-click to burn the entity.

### Testing notes
- There is **no automated test runner or lint config** — the acceptance tests (T1–T11) in `README.md` are manual in-browser checks.
- Manual QA hooks are exposed on `window.__dev` in the browser console (e.g. `__dev.win()`, `__dev.key(i)`, `__dev.chase()`, `__dev.die()`). They only fire when called manually and do not affect normal play.
- In a headless cloud VM (no GPU), the browser falls back to **software WebGL**. This produces harmless console warnings (e.g. `INVALID_OPERATION`, `ReadPixels` GPU-stall, software-WebGL-deprecation) and a `favicon.ico` 404. These are expected and do not indicate a broken build.
