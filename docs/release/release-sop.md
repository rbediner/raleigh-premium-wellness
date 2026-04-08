# Release SOP

This file is the repo-local source of truth for how releases must move through this website.

## Branch Roles

- `staging` is the proving ground and preview branch.
- `main` is the live production branch.
- Preview deploys must come from `staging`.
- Production deploys must come from `main`.
- The remote `staging` branch must exist so preview CI has a real branch to publish from.

## Non-Negotiable Rules

- Make changes on a feature branch.
- Merge approved work into `staging` first.
- Validate on `staging` before promotion.
- Share the preview URL and review that preview before production.
- Promote that exact approved commit to `main`.
- The production workflow must confirm that the promoted commit already exists on `staging`.
- Never announce production complete until verification passes.

## Standard Release Flow

1. Make changes on a feature branch.
2. Merge or move approved work into `staging`.
3. Run the smallest responsible QA gate with `npm run release:preflight:preview`.
4. Push `staging`.
5. Wait for the Preview Deploy workflow to pass.
6. Open the preview URL.
7. Review and approve the preview.
8. Promote the exact approved `staging` commit to `main`.
9. Run `npm run release:preflight:production` if you want a final local production check.
10. Push `main`.
11. Wait for the Production Deploy workflow to pass.
12. Confirm the production smoke verification passes.

## Preview Safety Rules

- Preview publishes under `/staging/`.
- Preview must be `noindex, noarchive, nofollow`.
- Preview must not publish a production canonical tag.
- Preview must feel like a real reviewable environment, not an untracked throwaway build.

## Production Rules

- Production publishes from `main` only.
- Production must not be marked `noindex`.
- Production verification should include the deploy URL, CI run URL, promoted SHA, and smoke result.

## GitHub Actions Runtime Maintenance

- The repo upgraded `actions/checkout` to `@v6`.
- The repo upgraded `actions/setup-node` to `@v6`.
- These upgrades address the directly controlled GitHub-hosted actions used by this repo's workflows.

Why the standard Pages workaround is not present here:

- This repo publishes GitHub Pages content by pushing to `gh-pages` with a custom script.
- This repo does not use `actions/upload-pages-artifact`.
- This repo does not use `actions/deploy-pages`.

That means the temporary workaround below is not active in this repo today:

- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'`

Only add that env var if this repo later adopts `actions/upload-pages-artifact@v4` and GitHub still emits the Node 20 warning from that action's internal dependencies.

If that future case happens, the cleanup path is:

1. upgrade to `actions/upload-pages-artifact@v5` when available
2. remove `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`

## If Something Fails

### If preview CI fails

- Stop and fix the issue on a feature branch or on `staging`.
- Re-run `npm run release:preflight:preview`.
- Push again only after the local gate passes.

### If production verification fails

- Treat the release as incomplete.
- Do not say it is live yet.
- Re-check the workflow logs and the live URL.
- Re-run the production smoke script until the site is actually serving correctly.

## Terminal And Process Cleanup

- Before ending a work session, inspect for stray local preview or browser QA processes.
- Run `ps -ax | rg "serve-static-site|playwright|chromium"` first.
- Only if needed, stop a stale preview server with `pkill -f "serve-static-site.mjs"`.
- Only if needed, stop a clearly stale browser QA process with `pkill -f "playwright|chromium"`.
- Leave the app terminal back at a normal shell prompt before handing off the repo.

## Cross-Machine Startup Rule

- Every new machine or new Codex session must read `README.md` first.
- Then read `docs/handoff/latest.md`.
- Then read this SOP before making changes.
- Align the local checkout to the handoff branch before editing.
- Run `npm run session:ready` before writing code.
- Refresh the canonical handoff with `npm run handoff:update` when the work block ends.
- Before ending the session, do the terminal and process cleanup sweep above.
