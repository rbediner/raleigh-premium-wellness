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
