# Latest Handoff

Handoff sequence: `11`

Updated at (UTC): `2026-04-10T20:30:00.000Z`

Source branch: `staging`

Source commit: `fbc2e95a58f305a4a4ff5fccc492034c8b87157e`

## Current Branch Model

- `staging` is the preview and integration branch.
- `main` is the production branch.
- Feature branches should merge into `staging` before anything is promoted to `main`.

## Branch Alignment Or Divergence Notes

- Current branch at update time: `staging`.
- Current HEAD at update time: `fbc2e95a58f305a4a4ff5fccc492034c8b87157e`.
- Upstream tracking branch: `origin/staging`
- Working tree: untracked files from BL-1 Codex work (see Blockers section).
- Compared with `origin/staging`: ahead 0, behind 0.

## Preview Or Staging URL

- https://rbediner.github.io/raleigh-premium-wellness/staging/

## Current CI Or Deploy Status Summary

- BL-3 push to staging triggered preview deploy — check GitHub Actions for current run status.
- Production Deploy on main: no recent run. BL-3 has not been promoted to production yet.

## Completed This Session: BL-3 (GA4 Analytics)

BL-3 is now implemented and merged to staging. The following was done:

### Files Changed
- `site/index.html` — GA4 snippet added to `<head>` before `<!-- BUILD_ENVIRONMENT_HEAD -->`
- `scripts/site/site-interactions.js` — two changes:
  1. `trackEvent()` extended to call `gtag('event', eventName, eventData)` in addition to the existing `window.dataLayer.push()`
  2. `form_submission_attempt` event added at the top of `handleFormSubmit()`, fires on every submit click before validation runs

### Measurement ID
`G-3FW9JG7S27` — GA4 property under `roman@romanbediner.com`

### Event Map (What Now Fires to GA4)

| Event | Trigger | Parameters |
|---|---|---|
| `page_view` | Auto on page load (gtag config) | `page_location`, `page_title` |
| `page_load` | DOMContentLoaded | `page` |
| `hero_cta_click` | Hero CTA clicked | `target` (e.g. `hero-work`) |
| `nav_click` | Nav anchor link clicked | `target` (e.g. `hero`, `work-with-us`) |
| `form_path_selection` | Path radio changed | `interestPath` |
| `form_submission_attempt` | Submit button clicked | `interestPath` |
| `form_submission_success` | Successful server response | `interestPath` |
| `form_submission_error` | Error / network failure | `interestPath`, `message` |

### QA Notes
- All events verified locally via gtag interception in the preview build.
- `form_path_selection` fires twice per radio change (once for `input`, once for `change` — pre-existing behavior from dual event listeners in `handleFormChange`, not introduced by BL-3).
- `form_submission_success` confirmed with mocked fetch (no real endpoint configured in local preview build — expected).
- `.claude/launch.json` created to support local preview QA via the Claude Preview panel.

### What Was NOT Touched
- `scripts/site/submission-gateway.js` — untouched (BL-1 work)
- `qa/unit/submission-gateway.test.js` — untouched
- `integrations/` — untouched
- All workflow files — untouched
- All copy, layout, CSS — untouched

## Blockers Or Manual Follow-Ups

- **BL-1 uncommitted work**: Codex left changes uncommitted on staging — `scripts/site/submission-gateway.js`, `qa/unit/submission-gateway.test.js`, `integrations/`, and modifications to `.github/workflows/preview-deploy.yml`, `.github/workflows/production-deploy.yml`, `qa/end-to-end/anchored-navigation-and-contact-form.spec.ts`, `scripts/release/build-site-artifact.mjs`. These need to be reviewed, committed, and tested before BL-1 can be marked DONE in the PRD.
- **BL-2**: Email notification wiring not yet started.
- **UI-1, UI-3, UI-5**: Still OPEN in the PRD.
- **GA4 DebugView verification**: Roman should open the staging preview URL with `?gtag_debug=1` and confirm events appear in the GA4 DebugView console at `analytics.google.com` under property `G-3FW9JG7S27`.

## Operator Notes For Next Session

- Read README.md first, then docs/handoff/latest.md, before making changes.
- Use the checked-in markdown reference files for the PRD and sheet instead of local `.gdoc` or `.gsheet` shortcuts.
- The PRD status for BL-3 should be updated to DONE.
- Before promoting to `main`, the uncommitted BL-1 work needs to be committed and verified on staging first.
- If picking up BL-2 (email notifications): target email is `roman.bediner@thetox.com`. Recommended approach is to add `MailApp.sendEmail()` inside the existing Google Apps Script (`integrations/google-sheets-submissions/Code.js`) after a successful row append — keeps the integration self-contained without adding a new service.
