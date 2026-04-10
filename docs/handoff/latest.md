# Latest Handoff

Handoff sequence: `12`

Updated at (UTC): `2026-04-10T21:00:00.000Z`

Source branch: `staging`

Source commit: `88621b4` (verify with `git rev-parse HEAD`)

## Current Branch Model

- `staging` is the preview and integration branch.
- `main` is the production branch.
- Feature branches should merge into `staging` before anything is promoted to `main`.

## Branch Alignment Or Divergence Notes

- Current branch at update time: `staging`.
- Working tree: clean. All files committed.
- Compared with `origin/staging`: ahead 0, behind 0.

## Preview Or Staging URL

- https://rbediner.github.io/raleigh-premium-wellness/staging/

## Current CI Or Deploy Status Summary

- Latest Preview Deploy: **PASSED** (run 24263219444, commit 88621b4)
- All 8 E2E tests passing.
- GA4 tag confirmed live in deployed staging HTML.
- Production Deploy on main: not yet run. BL-3 has not been promoted to production.

---

## What Was Done This Session (BL-3 + CI Repair)

### BL-3: GA4 Analytics — COMPLETE

**Files changed:**
- `site/index.html` — GA4 snippet (`G-3FW9JG7S27`) added to `<head>`
- `scripts/site/site-interactions.js` — `trackEvent()` now calls `gtag('event', ...)` in addition to `dataLayer.push()`; `form_submission_attempt` added to `handleFormSubmit()`

**Event map:**

| Event | Trigger | Parameters |
|---|---|---|
| `page_view` | Auto on load (gtag config) | `page_location`, `page_title` |
| `page_load` | DOMContentLoaded | `page` |
| `hero_cta_click` | Hero CTA clicked | `target` |
| `nav_click` | Nav anchor clicked | `target` |
| `form_path_selection` | Path radio changed | `interestPath` |
| `form_submission_attempt` | Submit clicked (pre-validation) | `interestPath` |
| `form_submission_success` | Successful server response | `interestPath` |
| `form_submission_error` | Error / network failure | `interestPath`, `message` |

**GA4 property:** `G-3FW9JG7S27` under `roman@romanbediner.com`

---

### CI Repair — COMPLETE

BL-3 accidentally introduced a broken dependency: `site-interactions.js` was committed with Codex's BL-1 import (`import { submitUnifiedFormSubmission } from "./submission-gateway.js"`) but `submission-gateway.js` had never been committed. This caused all 7 E2E tests to fail. Full root cause and resolution:

**Files committed as part of CI repair:**
- `scripts/site/submission-gateway.js` — Codex's BL-1 gateway (was untracked), now committed
- `qa/unit/submission-gateway.test.js` — unit tests for gateway (was untracked), now committed
- `scripts/release/build-site-artifact.mjs` — updated to:
  - Copy `submission-gateway.js` into build artifact
  - Read `FORM_SUBMISSION_ENDPOINT_URL` env var and inject as `window.__RaleighPremiumWellnessFormEndpoint` in both preview and production head markup
- `.github/workflows/preview-deploy.yml` — `FORM_SUBMISSION_ENDPOINT_URL: ${{ vars.FORM_SUBMISSION_ENDPOINT_URL }}` added to preflight and publish steps
- `.github/workflows/production-deploy.yml` — same env var added to preflight and publish steps
- `qa/end-to-end/anchored-navigation-and-contact-form.spec.ts` — submission success test now mocks the Apps Script network call via `page.route()` and injects a fake endpoint via `page.addInitScript()` so CI passes without a real deployment

---

## Blockers Or Manual Follow-Ups

### BL-2: Email Notifications — OPEN
- Target email: `roman.bediner@thetox.com`
- Recommended approach: add `MailApp.sendEmail()` inside `integrations/google-sheets-submissions/Code.js` after a successful row append
- The Apps Script code is in `integrations/google-sheets-submissions/Code.js` (untracked locally — needs to be deployed to Google and the `/exec` URL set as `FORM_SUBMISSION_ENDPOINT_URL` repo variable in GitHub)

### Apps Script Deployment — MANUAL STEP for Roman
- Deploy `integrations/google-sheets-submissions/Code.js` as a Google Apps Script web app
- Set the resulting `/exec` URL as `FORM_SUBMISSION_ENDPOINT_URL` in GitHub repo variables (Settings → Secrets and variables → Variables)
- Until this is done, form submissions will silently fail in production

### `integrations/` directory — UNTRACKED
- `integrations/google-sheets-submissions/Code.js` and supporting files exist locally but have never been committed
- They should be committed before promotion to main so the source of truth is in the repo

### PRD Updates Needed
- BL-3 → update status to DONE
- UI-1, UI-3, UI-5 → still OPEN

### Promotion to main
- Staging is clean and CI is green. BL-3 is ready to promote.
- Before promoting: consider whether to commit `integrations/` first (recommended)
- Follow the standard release SOP: merge staging → main, push main

### GA4 DebugView Verification (for Roman)
- Open the staging URL with `?gtag_debug=1` appended
- Go to GA4 console → property `G-3FW9JG7S27` → DebugView
- Confirm events stream in live: `page_view`, `hero_cta_click`, `form_path_selection`, `form_submission_attempt`, `form_submission_success`

---

## Operator Notes For Next Session

- Read README.md first, then this file, before making changes.
- Use the checked-in markdown reference files for the PRD and sheet.
- Run `npm run session:ready` before starting work.
- Monitor CI after every push to staging (`gh run list --repo rbediner/raleigh-premium-wellness --workflow preview-deploy.yml --limit 3`). This is required by the release SOP.
- If picking up BL-2: add `MailApp.sendEmail()` to `Code.js` after the `appendRow()` call. Subject should identify the inquiry type. Body should include the submitted field values.
