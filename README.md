# Prompt Experiment

**PROMPT LAB** — a public gallery of browser experiments built from prompts: games, toys, and interactive sketches.

**Live site:** [https://prompt-experiment.pages.dev](https://prompt-experiment.pages.dev)

---

## What’s here

| Experiment | Folder | Description |
|------------|--------|-------------|
| **Neon Dash** | [`geometry-dash-autoplay/`](./geometry-dash-autoplay/) | Geometry Dash–style autoplay (single HTML, Canvas + Web Audio) |
| **Bridge Horror House** | [`bridge-horror-house/`](./bridge-horror-house/) | First-person haunted escape (Three.js + Vite) |
| **Jack — 3D Creator** | [`jack-3d-portfolio/`](./jack-3d-portfolio/) | React portfolio landing (Tailwind + Framer Motion) |

The homepage (`index.html`) lists everything registered in [`experiments.json`](./experiments.json).

Original experiment prompts are archived in [`prompts/`](./prompts/).

---

## Quick start (local)

```bash
# Lab homepage + all static paths (from repo root)
python3 -m http.server 8080
# → http://localhost:8080
# → http://localhost:8080/geometry-dash-autoplay/
# → http://localhost:8080/bridge-horror-house/   (needs build first — see below)
# → http://localhost:8080/jack-3d-portfolio/     (needs build first — see below)

# Or build everything for Cloudflare-style output
npm run build
npx --yes serve .cf-pages
```

### Neon Dash (static single HTML)

No install required — it’s one self-contained file:

```bash
# Option A: open the file directly in a browser
open geometry-dash-autoplay/index.html   # macOS
# xdg-open geometry-dash-autoplay/index.html   # Linux

# Option B: serve the folder
cd geometry-dash-autoplay
python3 -m http.server 8765
# → http://localhost:8765
```

### Bridge Horror House (Vite + Three.js)

```bash
cd bridge-horror-house
npm install
npm run dev
# → http://localhost:5180
```

### Jack — 3D Creator portfolio (Vite + React)

```bash
cd jack-3d-portfolio
npm install
npm run dev
# → http://localhost:5173/jack-3d-portfolio/
```

---

## Add a new experiment

1. Create a **feature branch** (never push straight to `main`).
2. Add a **new top-level folder** for the experiment.
3. Append an entry to `experiments.json`.
4. If it needs a build step, wire it into `scripts/prepare-deploy.mjs`.
5. Open a PR → merge → **delete the feature branch**.

Agent rules: see [`AGENTS.md`](./AGENTS.md).  
Cloudflare Pages setup: see [`CLOUDFLARE.md`](./CLOUDFLARE.md).

---

## Deploy

Production deploys from **`main`** via Cloudflare Pages.

- Build command: `npm run build`
- Output directory: `.cf-pages`

Every merge to `main` republishes [prompt-experiment.pages.dev](https://prompt-experiment.pages.dev).
