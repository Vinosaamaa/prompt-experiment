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

---

## Every new experiment (required)

6. **Create a new top-level folder** for each new experiment. Do not dump new experiments into an unrelated existing folder.
7. **Build exactly what was requested** — match the prompt’s scope and features; do not silently shrink the brief.
8. **Make it workable** — the experiment must actually run and be usable end-to-end.
9. **Test it and fix every bug you find** before considering the work done.
10. **Screen-record the experiment** after it works, so the result can be reviewed (attach/include the recording with the PR when possible).
11. **Register public experiments in `experiments.json`** so they appear on the lab homepage.
12. Prefer **self-contained** experiments (single HTML or a small local app). Avoid cross-experiment imports.
13. Do not modify unrelated experiments unless the task explicitly requires it.

---

## Quality & hygiene

14. Do not commit secrets, `.env` files with credentials, `node_modules/`, or huge binary dumps.
15. Keep the lab homepage (`index.html`) polished when you change shared lab UI.
16. Add new **global** agent rules to this `AGENTS.md` via PR (do not bury them only in chat).
17. Experiment-specific creative briefs can live in that folder (`SYSTEM_PROMPT.md`, `README.md`, etc.).

---

## Quick checklist before opening a PR

- [ ] On a feature branch (not `main`)
- [ ] New/updated experiment lives in its own folder
- [ ] Built to match the request; runs and is workable
- [ ] Bugs found in testing were fixed
- [ ] Screen recording captured for review
- [ ] `experiments.json` updated if it should appear on the homepage
- [ ] No secrets / no `node_modules` committed
- [ ] PR describes what changed and how to try it
