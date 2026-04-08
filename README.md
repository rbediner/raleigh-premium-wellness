# The Tox Raleigh Outreach Site

This repository holds the placeholder outreach site for The Tox Raleigh launch.

## Current Product Direction

- One mobile-first anchored landing page for MVP
- Primary goal is to support Studio Development Manager outreach and referrals
- Secondary goals include partner outreach and future client/community list building
- Form submissions will flow into Google Sheets during the next integration phase
- Hosting target is GitHub Pages using a dedicated `gh-pages` publish branch

## Repository Structure

- `assets/` stores reusable visual assets and source imagery
- `data-sources/` stores shortcuts to connected planning/data files such as Google Sheets
- `planning/` stores shortcuts to source planning documents such as the PRD
- `qa/` stores unit tests, end-to-end tests, and QA configuration
- `scripts/` stores browser scripts and local automation helpers
- `site/` stores the main HTML document for the website
- `styles/` stores site styling
- `docs/` stores release workflow, handoff notes, and QA guidance

## Working Notes

- Primary PRD source: `planning/the-raleigh-tox-prd.gdoc`
- Google Sheet source: `data-sources/the-tox-raleigh-outreach-sheet.gsheet`
- GitHub repository: `rbediner/the-tox-raleigh-outreach-site`
- Repository visibility: private

## Prerequisites

These are the tools this repo now expects:

- Node.js 20 or newer
- npm 10 or newer
- Git
- GitHub CLI (`gh`) for convenient branch/workflow inspection
- Playwright browser dependencies for browser QA

Install the browser dependency once with:

```bash
npx playwright install chromium
```

## Available Commands

- `npm run preview:staging` builds and serves the staging preview artifact locally
- `npm run preview:production` builds and serves the production artifact locally
- `npm run qa:session-readiness` checks that the repo and machine are ready for a safe session
- `npm run qa:docs-gate` verifies that the release SOP docs exist and say the right things
- `npm run qa:preview-smoke:local` runs a local smoke check against the staging preview artifact
- `npm run qa:production-smoke:local` runs a local smoke check against the production artifact
- `npm run release:preflight:preview` runs the smallest responsible preview gate
- `npm run release:preflight:production` runs the smallest responsible production gate
- `npm run test:unit` runs unit tests for form logic
- `npm run test:workflow` runs policy tests for release docs, workflows, and artifact rules
- `npm run test:qa` runs end-to-end browser QA checks
- `npm run test:all` runs the unit and QA suites sequentially

## Release Workflow

Plain-English rule:

- `staging` is the preview branch
- `main` is the live production branch
- preview deploys come from `staging`
- production deploys come from `main`
- production is not considered complete until deploy verification passes

### Normal Operator Flow

1. Make changes on a feature branch.
2. Merge approved feature work into `staging`.
3. Run `npm run release:preflight:preview`.
4. Push `staging` and wait for the Preview Deploy workflow to pass.
5. Open the preview URL and review the exact preview build.
6. Approve that exact preview commit.
7. Promote that exact approved commit from `staging` to `main`.
8. Run `npm run release:preflight:production` if you need a last local production check.
9. Push `main` and wait for the Production Deploy workflow to pass.
10. Confirm the production smoke verification passes before saying the release is live.

The production workflow also enforces one more rule automatically: the commit on `main` must already exist on `staging`. If it does not, production deploy fails on purpose.

### What “preview approved commit” means

It means the exact commit SHA that passed on `staging` and was reviewed on the preview URL is the same commit that gets promoted to `main`. Do not rebuild different code and assume it is equivalent.

### Preview URL

Once GitHub Pages is enabled for the `gh-pages` branch, the preview URL will be:

`https://rbediner.github.io/the-tox-raleigh-outreach-site/staging/`

### Production URL

Once GitHub Pages is enabled for the `gh-pages` branch, the production URL will be:

`https://rbediner.github.io/the-tox-raleigh-outreach-site/`

### One-Time Manual GitHub Setup

GitHub Pages still needs one manual repo setting:

1. Open the GitHub repository settings.
2. Go to `Pages`.
3. Set the source to the `gh-pages` branch and the root folder.
4. Save.

After that, the preview and production workflows can publish the preview path and the live root automatically.

If the remote `staging` branch does not exist yet, create it once from the current approved codebase:

```bash
git checkout -b staging
git push -u origin staging
git checkout main
```

### If CI Fails

- Do not promote anything to `main`.
- Read the failing workflow log first.
- Run the matching local command from this README.
- Fix the issue on a feature branch or on `staging`, then rerun preview.

### If Deploy Verification Fails

- Do not announce that production is complete.
- Treat the release as incomplete until the smoke check passes.
- Re-check the workflow run, deploy summary, and live URL.
- Only after the verification step is green should the release be considered live.

### Release Evidence To Record

Every completed release should capture:

- the promoted SHA
- the CI run URL
- the deploy run URL
- the live smoke result

The handoff file in `docs/handoff/latest.md` is the canonical place to keep that information up to date.
