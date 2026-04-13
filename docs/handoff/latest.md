# Latest Handoff

Handoff sequence: `14`

Updated at (UTC): `2026-04-13T19:46:00.000Z`

Source branch: `staging`

Source commit: `59bf2af` (verify with `git rev-parse HEAD`)

## Current Branch Model

- `staging` is the preview and integration branch.
- `main` is the production branch.
- Feature branches should merge into `staging` before anything is promoted to `main`.

## Branch Alignment Or Divergence Notes

- Current branch at update time: `staging`.
- Remote branch alignment at last checked state: local `staging` matched `origin/staging`.
- Working tree is not currently clean because local cleanup and integration follow-up work may be in progress.

## Preview Or Staging URL

- https://rbediner.github.io/raleigh-premium-wellness/staging/

## Current CI Or Deploy Status Summary

- Latest recorded staging commit in handoff context: `59bf2af`
- Preview deploy history after BL-3 has been green, but BL-1 operational wiring should be re-verified after the Google account ownership cleanup
- GA4 wiring is in the site code and should remain associated with the Ads / analytics Google account, not the operational Sheets / Apps Script account

---

## What Was Done Before This Cleanup Review

### BL-3: GA4 Analytics — COMPLETE

Files already on `staging` include:
- `site/index.html`
- `scripts/site/site-interactions.js`

Current intent:
- GA4 remains in place
- Ads / analytics ownership should stay with `rbediner@gmail.com`

### BL-1 Scaffolding: PARTIAL

Repo-side work already present on `staging` includes:
- `scripts/site/submission-gateway.js`
- `scripts/release/build-site-artifact.mjs`
- `.github/workflows/preview-deploy.yml`
- `.github/workflows/production-deploy.yml`
- `qa/unit/submission-gateway.test.js`
- mocked browser coverage in `qa/end-to-end/anchored-navigation-and-contact-form.spec.ts`

This means:
- the browser form is prepared to call a real endpoint
- the build pipeline is prepared to inject `FORM_SUBMISSION_ENDPOINT_URL`
- CI can validate the success path with a mocked endpoint
- BL-1 should not be treated as fully live until the real Apps Script deployment, repo variable, and sheet-write QA are verified under the correct Google account

---

## Blockers Or Manual Follow-Ups

### Google Service Account Split — NOW EXPLICIT

- Google Ads and GA4 work should stay under `rbediner@gmail.com`
- Google Sheets, Apps Script, and other operational Google work should use `roman.bediner@cormanity.com`
- The spelling of `roman.bediner@cormanity.com` should be confirmed before provisioning additional Google resources
- Read `docs/integrations/google-service-ownership.md` before doing Google-integrated work on a new machine

### BL-1: Google Sheets Submission Wiring — STILL OPEN

- The repo has the BL-1 frontend and Apps Script scaffolding, but operational completion still needs confirmation under the correct Google account
- The GitHub repository variable `FORM_SUBMISSION_ENDPOINT_URL` should be checked and set to the correct deployed `/exec` URL
- Real browser-to-sheet QA still needs to be rerun after the account ownership cleanup

### `integrations/` Source Of Truth

- `integrations/google-sheets-submissions/` should be committed as repo source of truth
- Local `.clasp.json` bindings should remain machine-local until the canonical Apps Script owner account and script binding are finalized

### BL-2: Email Notifications — OPEN

- Target notification address remains `roman.bediner@thetox.com`
- Recommended approach is still to add `MailApp.sendEmail()` after a successful row append inside `integrations/google-sheets-submissions/Code.js`

### PRD Follow-Up

- The PRD Google Doc has been updated to reflect the Google account ownership split, BL-1's partial/live status, and BL-3's implemented state
- Continue keeping the PRD in sync as BL-1 and BL-2 move from scaffolded to fully operational

---

## Operator Notes For Next Session

- Read `README.md` first, then this file.
- If the work touches Google services, also read `docs/integrations/google-service-ownership.md`.
- Use the checked-in markdown reference files for the PRD and sheet.
- Run `npm run session:ready` before starting work.
- Monitor CI after every push to staging. This is required by the release SOP.
- Do not assume the old BL-1 notes are still accurate; re-check the actual repo files and GitHub variable state before continuing backend work.
