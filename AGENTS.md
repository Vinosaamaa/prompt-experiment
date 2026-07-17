# AGENTS.md — Prompt Experiment Lab

Rules for **every** agent working in this repository.
Project-specific notes may also live inside an experiment folder; **this file wins** for repo-wide process.

---

## Non-negotiable workflow

1. **Never push directly to `main`.**
2. **Always** create a feature branch, open a Pull Request, and merge to `main` through that PR.
3. Do not force-push to `main`. Do not commit on `main` locally and push.
4. Prefer branch names like `cursor/<short-description>-xxxx` (lowercase).
5. Keep PRs focused: one experiment or one cohesive change set per PR when practical.

`main` is the public Cloudflare Pages production branch. A direct push skips review and can break the live lab.

---

## Recommended standing rules

### Experiments
6. **One experiment = one top-level folder** (e.g. `geometry-dash-autoplay/`, `bridge-horror-house/`).
7. **Register every public experiment in `experiments.json`** so the homepage lists it automatically.
8. Prefer **self-contained** experiments (single HTML or a small local app). Avoid cross-experiment imports.
9. Do not modify unrelated experiments unless the task explicitly requires it.
10. If an experiment needs a build step (Vite, etc.), keep build config inside that folder and ensure the root Cloudflare build still publishes it.

### Quality bar
11. Ship something **runnable**: local instructions and/or a working deploy path.
12. For visual/interactive work, include a short recording or screenshots in the PR when feasible.
13. Fix bugs you introduce before asking for merge.
14. Do not commit secrets, `.env` files with credentials, `node_modules/`, or huge binary dumps.

### Site & deploy
15. The lab homepage is root `index.html`. Treat it as the public front door — keep it polished.
16. Cloudflare Pages auto-deploys from `main`. Assume every merge is production.
17. After changing deploy/build config, verify the publish script still outputs all live experiments.

### Communication inside the repo
18. Add new **global** agent rules to this `AGENTS.md` via PR (do not bury them only in chat).
19. Experiment-specific creative briefs can live in that folder (`SYSTEM_PROMPT.md`, `README.md`, etc.).

---

## Quick checklist before opening a PR

- [ ] On a feature branch (not `main`)
- [ ] Experiment folder added/updated
- [ ] `experiments.json` updated if the experiment should appear on the homepage
- [ ] Runs locally (or static path works)
- [ ] No secrets / no `node_modules` committed
- [ ] PR describes what changed and how to try it
