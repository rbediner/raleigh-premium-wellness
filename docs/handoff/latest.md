# Latest Handoff

Handoff sequence: `17`

Updated at (UTC): `2026-04-14T13:46:00.000Z`

Source branch: `staging`

Source commit: `287554b` (verify with `git rev-parse HEAD`)

## Current Branch Model

- `staging` is the preview and integration branch.
- `main` is the production branch.
- Feature branches should merge into `staging` before anything is promoted to `main`.

## Branch Alignment Or Divergence Notes

- Current integration branch: `staging`
- Feature branch snapshot also exists remotely at:
  - `origin/codex/backend-readiness-bl1-bl2`
- Working tree now includes:
  - `docs/handoff/latest.md`
  - `integrations/google-sheets-submissions/Code.js`
  - `integrations/google-sheets-submissions/appsscript.json`
  - `qa/unit/google-sheets-submissions.test.js`
  - `assets/review-screenshots/2026-04-14-backend-readiness/`

## Preview Or Staging URL

- Current published staging URL remains: https://rbediner.github.io/raleigh-premium-wellness/staging/
- Local staging-equivalent preview with the real backend was verified at `http://127.0.0.1:4173`
- GitHub repo variable has been updated so the next staging deploy will use the live Apps Script endpoint

## Current CI Or Deploy Status Summary

- No push to `staging` yet in this session
- GitHub repo variable `FORM_SUBMISSION_ENDPOINT_URL` is now set to the live Apps Script `/exec` URL
- BL-2 code is implemented in-branch
- Live Apps Script endpoint is now healthy and publicly reachable

---

## What Was Completed In This Session

### Google Ownership Recovery — COMPLETE

- Logged `clasp` out of the stale session
- Re-authenticated `clasp` under `roman.bediner@cormanity.com`
- Verified the active Google identity is the `cormanity.com` account

### New Apps Script Project — COMPLETE

New clean Apps Script project under the correct account:
- Script ID: `1J4agDeFusQ0BB7KLAKtdG3QWKd_HuQeFngp3sd_KGCo2uGthHy0dn_Vu`
- Script editor URL:
  - https://script.google.com/d/1J4agDeFusQ0BB7KLAKtdG3QWKd_HuQeFngp3sd_KGCo2uGthHy0dn_Vu/edit

Why this was necessary:
- the older bound script appeared to come from the wrong Google account lineage
- the cleanest path was to create a brand-new Apps Script project under `roman.bediner@cormanity.com`

### Live Web App Deployment — COMPLETE

Current live deployment details:
- Deployment ID: `AKfycbwilm9PIHYu1ygTOqHNlAqzizXakxyfzZHw_KzCo1GJqy4x8INdeMDyVGALx8iNdrrX`
- Live `/exec` URL:
  - https://script.google.com/macros/s/AKfycbwilm9PIHYu1ygTOqHNlAqzizXakxyfzZHw_KzCo1GJqy4x8INdeMDyVGALx8iNdrrX/exec

Important implementation note:
- The web app initially failed anonymously because the manifest used the wrong public access enum
- `integrations/google-sheets-submissions/appsscript.json` now uses:
  - `"access": "ANYONE_ANONYMOUS"`
- The script also required a first owner-side authorization run of `doGet` in the Apps Script editor before the public endpoint started returning JSON successfully

### BL-1 Backend Wiring — COMPLETE AT BACKEND LEVEL

Confirmed:
- live anonymous `/exec` endpoint now returns JSON successfully
- direct POST requests to the endpoint succeed for:
  - `work_with_us`
  - `partner_with_us`
  - `stay_connected`
- each response reported:
  - correct tab name
  - row number
  - `notification_email_sent: true`

Example direct live responses observed:
- `work_with_us` -> `{"ok":true,"sheet_name":"work_with_us","row_number":2,"notification_email_sent":true}`
- `partner_with_us` -> `{"ok":true,"sheet_name":"partner_with_us","row_number":2,"notification_email_sent":true}`
- `stay_connected` -> `{"ok":true,"sheet_name":"stay_connected","row_number":2,"notification_email_sent":true}`

### BL-2 Internal Notification Email — COMPLETE IN CODE AND LIVE RESPONSE

Updated file:
- `integrations/google-sheets-submissions/Code.js`

Behavior now implemented:
- sends internal email only after successful row append
- subject line identifies inquiry type
- body includes row metadata and submitted fields
- response includes notification send state

### Browser QA Against Real Backend — COMPLETE LOCALLY

The following browser flows were run end to end against a local staging-equivalent preview built with the live `/exec` endpoint:
- Work With Us
- Partner With Us
- Stay Connected / VIP

Result:
- each form submitted successfully through the real backend
- each success state rendered after real backend completion
- browser success screenshots were captured

Evidence files saved in repo:
- `assets/review-screenshots/2026-04-14-backend-readiness/work-with-us-browser-success.png`
- `assets/review-screenshots/2026-04-14-backend-readiness/partner-with-us-browser-success.png`
- `assets/review-screenshots/2026-04-14-backend-readiness/stay-connected-browser-success.png`

### Repo Variable Wiring — COMPLETE

Confirmed:
- `FORM_SUBMISSION_ENDPOINT_URL` now points to:
  - `https://script.google.com/macros/s/AKfycbwilm9PIHYu1ygTOqHNlAqzizXakxyfzZHw_KzCo1GJqy4x8INdeMDyVGALx8iNdrrX/exec`

---

## What Is Still Open

### Staging Branch Promotion — NOT YET DONE

- The feature branch has not yet been merged into `staging`
- Therefore the public GitHub Pages staging site has not yet been re-deployed with this live endpoint wiring

### Sheet Row Screenshot Evidence — STILL MISSING

- Direct backend POST responses confirm successful writes
- However, sheet-row screenshot capture is still missing from this session
- Attempts to use a connector shortcut for sheet retrieval were blocked by token expiration on the Google Drive connector

### Notification Email Screenshot Evidence — STILL MISSING

- Live backend responses reported `notification_email_sent: true`
- But no inbox screenshot was captured in this session

### BL-3 Follow-Up — STILL PENDING

- Core GA4 implementation remains untouched
- BL-3 follow-up should happen only after the code is promoted to `staging` and the public staging site is actually using the live backend endpoint

---

## QA Run In This Session

Commands run successfully:

```bash
npm run test:unit -- qa/unit/submission-gateway.test.js qa/unit/google-sheets-submissions.test.js
node scripts/qa/run-browser-quality-checks.mjs
```

Additional live backend verification performed:

```bash
curl -L https://script.google.com/macros/s/AKfycbwilm9PIHYu1ygTOqHNlAqzizXakxyfzZHw_KzCo1GJqy4x8INdeMDyVGALx8iNdrrX/exec
```

Observed result:
- returned JSON health payload with available paths and spreadsheet ID

Additional real write verification performed:
- posted live JSON submissions directly to the `/exec` endpoint for all three paths
- all three returned `ok: true`

Additional real browser verification performed:
- local preview built with live endpoint
- successful browser submissions across all three persona paths
- success-state screenshots captured

Important limitation:
- this does **not** yet count as proof that the published GitHub Pages staging URL has been updated, because `staging` has not yet been pushed in this session

---

## Operator Notes For Next Session

- Stay on branch `codex/backend-readiness-bl1-bl2`
- Do not recreate the Apps Script project; the clean one already exists under the correct account

### Exact Next Steps

1. Decide whether to:
   - commit + push the feature branch first
   - then merge/promote into `staging`
2. After `staging` is updated, wait for the preview deploy to finish
3. Re-test the published staging URL:
   - https://rbediner.github.io/raleigh-premium-wellness/staging/
4. Capture the remaining missing evidence:
   - sheet row screenshots for all three tabs
   - notification email screenshot for at least one successful submission
   - GA4 follow-up evidence or explicit block reason
5. Only after the public staging URL is verified should BL-1 be treated as fully complete from a release perspective

### Important IDs And URLs

- New Apps Script script ID:
  - `1J4agDeFusQ0BB7KLAKtdG3QWKd_HuQeFngp3sd_KGCo2uGthHy0dn_Vu`
- Live deployment ID:
  - `AKfycbwilm9PIHYu1ygTOqHNlAqzizXakxyfzZHw_KzCo1GJqy4x8INdeMDyVGALx8iNdrrX`
- Live `/exec` URL:
  - https://script.google.com/macros/s/AKfycbwilm9PIHYu1ygTOqHNlAqzizXakxyfzZHw_KzCo1GJqy4x8INdeMDyVGALx8iNdrrX/exec

### Old Wrong-Account Script Cleanup

- Old script deletion has **not** been completed
- Reason:
  - that cleanup likely requires access under the original owner account of the old script
- Do not delete anything blindly until the old script is positively identified under the old account

### Important Safety Reminders

- Do not deploy Apps Script under `rbediner@gmail.com`
- Do not move GA4 ownership away from `rbediner@gmail.com`
- Do not reopen front-end polish or copy work during the backend completion pass
- Keep `.clasp.json` machine-local if another machine needs its own local binding workflow
