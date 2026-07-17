# Prompt Experiment

**PROMPT LAB** — a public gallery of browser experiments built from prompts: games, toys, and interactive sketches.

**Live site:** [https://prompt-experiment.pages.dev](https://prompt-experiment.pages.dev)

---

## What’s here

| Experiment | Folder | Description |
|------------|--------|-------------|
| **Neon Dash** | [`geometry-dash-autoplay/`](./geometry-dash-autoplay/) | Geometry Dash–style autoplay (single HTML, Canvas + Web Audio) |
| **Bridge Horror House** | [`bridge-horror-house/`](./bridge-horror-house/) | First-person haunted escape (Three.js + Vite) |

The homepage (`index.html`) lists everything registered in [`experiments.json`](./experiments.json).

---

## Quick start (local)

```bash
# Lab homepage + static experiments
python3 -m http.server 8080
# → http://localhost:8080

# Or build the full Cloudflare publish folder (includes Vite games)
npm run build
npx --yes serve .cf-pages
```

Bridge Horror House alone:

```bash
cd bridge-horror-house
npm install
npm run dev
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
