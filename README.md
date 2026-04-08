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
- `data-sources/` stores stable reference docs for connected spreadsheets and data sources
- `planning/` stores stable reference docs for source planning documents such as the PRD
- `qa/` stores unit tests, end-to-end tests, and QA configuration
- `scripts/` stores browser scripts and local automation helpers
- `site/` stores the main HTML document for the website
- `styles/` stores site styling
- `docs/` stores release workflow, handoff notes, and QA guidance

## Working Notes

- Primary PRD source: `planning/the-raleigh-tox-prd-reference.md`
- Google Sheet source: `data-sources/the-tox-raleigh-outreach-sheet-reference.md`
- GitHub repository: `rbediner/raleigh-premium-wellness`
- Repository visibility: private

## Prerequisites

These are the tools this repo now expects:

- Node.js 20.x, matching `.nvmrc`
- npm 10 or newer
- Git
- GitHub CLI (`gh`) for convenient branch/workflow inspection
- Playwright browser dependencies for browser QA

Install the browser dependency once with:

```bash
npx playwright install chromium
```

If you use `nvm`, align Node to the repo before doing anything else:

```bash
nvm use
```

## Available Commands

- `npm run assets:optimize:founder-photo` regenerates responsive founder-photo image variants from the checked-in source image
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

`https://rbediner.github.io/raleigh-premium-wellness/staging/`

### Production URL

Once GitHub Pages is enabled for the `gh-pages` branch, the production URL will be:

`https://rbediner.github.io/raleigh-premium-wellness/`

### One-Time Manual GitHub Setup

GitHub Pages still needs one manual repo setting:

1. Open the GitHub repository settings.
2. Go to `Pages`.
3. Set the source to the `gh-pages` branch and the root folder.
4. Save.

After that, the preview and production workflows can publish the preview path and the live root automatically.

## GitHub Actions Runtime Maintenance

This repo has already been updated for GitHub's Node 20 JavaScript action-runtime deprecation where it applies directly to our workflow files.

- `actions/checkout` was upgraded to `@v6`
- `actions/setup-node` was upgraded to `@v6`

Why this repo is a little different from other GitHub Pages setups:

- This repo does use GitHub Pages as the host.
- This repo does **not** use `actions/upload-pages-artifact` or `actions/deploy-pages`.
- Instead, the preview and production workflows publish to the `gh-pages` branch with our own script in `scripts/release/publish-github-pages-branch.mjs`.

Because of that, the temporary Pages workaround from other projects is **not** needed here:

- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` was **not** added to these workflows.
- The specific lingering warning tied to `actions/upload-pages-artifact@v4` does not apply in this repo because that action is not used here.

If this repo later switches to the standard GitHub Pages artifact workflow and still needs `actions/upload-pages-artifact@v4`, then use this temporary workaround on the affected job:

- set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: 'true'` at the job level
- do the same for any rollback or redeploy job that also uses `actions/upload-pages-artifact@v4`

When GitHub releases `actions/upload-pages-artifact@v5`, the future cleanup path is:

1. upgrade to `actions/upload-pages-artifact@v5`
2. remove `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`

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

### Before Ending A Session

Do a quick terminal and process sweep so the repo is not left with stray preview servers or hanging browser jobs.

Inspect first:

```bash
ps -ax | rg "serve-static-site|playwright|chromium"
```

If you find a stray local preview server, stop it with:

```bash
pkill -f "serve-static-site.mjs"
```

If you find a clearly stale Playwright or Chromium process tied to this repo, stop it with:

```bash
pkill -f "playwright|chromium"
```

Best-practice note:

- Inspect before killing anything.
- Only kill clearly stale local preview or browser QA processes.
- The app terminal should be back at a normal shell prompt before you leave the session.

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

## Cross-Machine Continuity

This repo is set up so you can switch laptops or Codex sessions without depending on chat memory. The one canonical handoff file is:

- `docs/handoff/latest.md`

That file is single-entry only. We keep only the latest repo state there and rely on Git history for older handoffs.

One important repo-safety rule:

- Do not rely on cloud-synced `.gdoc` or `.gsheet` shortcut files as tracked repo state.
- This repo keeps stable markdown reference files instead, so another machine can always recover the source document URLs even if Drive shortcuts disappear.

### Fresh Machine Or New Session Startup Flow

Do these steps every time you open this repo on a new machine or in a new Codex session:

1. Open `README.md`.
2. Open `docs/handoff/latest.md`.
3. Open `docs/release/release-sop.md`.
4. Align your local checkout to the handoff branch before editing.
5. Make sure the branch is committed or clean before editing.
6. Run `npm run session:ready`.
7. Before ending the session, run the terminal/process sweep from this README and make sure the app terminal is back at a shell prompt.

### What `npm run session:ready` checks

This command fails on purpose if any of these are wrong:

- `README.md` is missing
- `docs/handoff/latest.md` is missing
- `.nvmrc` is missing
- your Node version does not match the repo expectation
- the working tree is dirty
- your current branch does not match the handoff branch
- local `HEAD` does not match `origin/<handoff-branch>`
- obvious cloud-sync duplicate artifacts are present

### Refreshing The Handoff

Whenever you finish a meaningful work block, refresh the canonical handoff file with:

```bash
npm run handoff:update
```

That command rewrites `docs/handoff/latest.md` with the latest repo state, increments the handoff sequence, and keeps the handoff deterministic for the next machine.

### Friendly Resume Rule

Before editing code on a new machine, do not trust memory alone. Read the repo docs first, align to the handoff branch, and wait for `npm run session:ready` to pass.
