# Google Sheets Submission Gateway

Purpose:
- receive unified browser submissions from the Raleigh Premium Wellness site
- route each submission to the correct Google Sheets tab
- stamp each row with time metadata before it is appended

Files:
- `Code.js`: Google Apps Script web-app endpoint
- `appsscript.json`: Apps Script project manifest

Deployment notes:
- deploy as a web app
- execute as: user deploying
- access: anyone
- after deployment, set the repository variable `FORM_SUBMISSION_ENDPOINT_URL` to the `/exec` URL
- use the operational Google account for Sheets / Apps Script work, not the Ads / GA4 account
- see `docs/integrations/google-service-ownership.md` before authenticating `clasp` on a new machine

Account note:
- this integration should be owned and operated under `roman.bediner@cormanity.com`
- do not treat the GA4 / Ads Google account as the owner for this script
- version-control workflow details live in `docs/integrations/apps-script-version-control-runbook.md`

Sheet tabs expected:
- `work_with_us`
- `partner_with_us`
- `stay_connected`
- `test_submissions`
- `email_delivery_log`

Public path mapping:
- `find_out_whats_coming` routes to the existing `stay_connected` tab for continuity
- legacy `stay_connected` payloads are still accepted and normalized server-side
- `is_test_submission=true` routes into `test_submissions` so QA traffic never mixes with real intake traffic

Notification guardrails:
- internal notification delivery attempts are logged in `email_delivery_log`
- `GmailApp` is attempted first
- `MailApp` is used as a fallback provider
- the submission response reports `notification_email_sent=false` only if all providers fail for all recipients

Version-control and deployment best practice:
- keep `Code.js` and `appsscript.json` in git as source-of-truth
- avoid UI-only edits as a long-term workflow
- after script changes, always deploy a **new version** and verify `doGet` reports expected `available_paths`
- run `npm run qa:backend:live -- --endpoint <exec-url> --spreadsheet-id <sheet-id>` for post-deploy evidence

Important:
- do not delete the linked Google Doc, Google Sheet, or Google Slides reference files in this repo
- use `data-sources/the-tox-raleigh-outreach-sheet-reference.md` as the stable checked-in sheet reference
