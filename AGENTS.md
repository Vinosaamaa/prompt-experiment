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
6. **Do not merge a PR into `main` unless the human explicitly agrees / asks to merge.** Opening the PR is enough; wait for approval.
7. **After a PR is merged, close it (if still open) and delete the feature branch** (remote and local). Do not leave merged feature branches around.

`main` is the public Cloudflare Pages production branch. A direct push skips review and can break the live lab.

---

## Code review loop (CodeRabbit / PR comments)

8. For **every PR**, wait for the automated code review (CodeRabbit) and any review comments posted on the PR.
9. Read **all** review comments in the PR comment / review threads.
10. Fix the valid issues, push updates to the same feature branch, and re-check the review feedback.
11. Repeat this **review → fix → push** loop until the review issues are addressed, **at most 3 times**.
12. Do not ignore open review comments. If something should not be changed, reply on the thread explaining why.
13. Do **not** merge while unresolved review-fix work is still in progress, and still only merge when the human agrees (rule 6).

---

## Recommended standing rules

### Experiments
14. **One experiment = one top-level folder** (e.g. `geometry-dash-autoplay/`, `bridge-horror-house/`).
15. **Register every public experiment in `experiments.json`** so the homepage lists it automatically.
16. Prefer **self-contained** experiments (single HTML or a small local app). Avoid cross-experiment imports.
17. Do not modify unrelated experiments unless the task explicitly requires it.
18. If an experiment needs a build step (Vite, etc.), keep build config inside that folder and ensure the root Cloudflare build still publishes it.

### Quality bar
19. Ship something **runnable**: local instructions and/or a working deploy path.
20. For visual/interactive work, include a short recording or screenshots in the PR when feasible.
21. Fix bugs you introduce before asking for merge.
22. Do not commit secrets, `.env` files with credentials, `node_modules/`, or huge binary dumps.

### Site & deploy
23. The lab homepage is root `index.html`. Treat it as the public front door — keep it polished.
24. Cloudflare Pages auto-deploys from `main`. Assume every merge is production.
25. After changing deploy/build config, verify the publish script still outputs all live experiments.

### Communication inside the repo
26. Add new **global** agent rules to this `AGENTS.md` via PR (do not bury them only in chat).
27. Experiment-specific creative briefs can live in that folder (`SYSTEM_PROMPT.md`, `README.md`, etc.).

---

## Quick checklist before opening a PR

- [ ] On a feature branch (not `main`)
- [ ] Experiment folder added/updated
- [ ] `experiments.json` updated if the experiment should appear on the homepage
- [ ] Runs locally (or static path works)
- [ ] No secrets / no `node_modules` committed
- [ ] PR describes what changed and how to try it

## Review checklist (before asking to merge)

- [ ] CodeRabbit / PR review has run
- [ ] All review comments were read
- [ ] Valid issues fixed (review→fix loop, max 3)
- [ ] Replied on threads that were intentionally not changed
- [ ] Human explicitly agreed to merge

## After merge checklist

- [ ] Feature branch deleted on the remote
- [ ] Local feature branch deleted
- [ ] No leftover open draft PRs for that work
