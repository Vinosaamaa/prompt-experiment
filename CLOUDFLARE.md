# Cloudflare Pages

This repo is set up for **Cloudflare Pages** with automatic deploys from `main`.

## One-time setup (in Cloudflare dashboard)

1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com/) → **Create** → **Pages** → **Connect to Git**.
2. Select the `prompt-experiment` repository.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `.cf-pages`
   - **Root directory:** `/` (repo root)
   - **Production branch:** `main`
4. Deploy. You’ll get a URL like `https://prompt-experiment.pages.dev` (name may vary; you can edit the project name).

Every merge to `main` republishes the lab automatically.

## Local publish smoke-test

```bash
npm run build
npx --yes serve .cf-pages
```

## Adding an experiment

1. Create a feature branch (never push straight to `main`).
2. Add a folder at repo root.
3. Append an entry to `experiments.json`.
4. If it needs a build, wire it into `scripts/prepare-deploy.mjs`.
5. Open a PR → merge to `main`.
