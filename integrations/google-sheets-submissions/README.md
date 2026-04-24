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

Sheet tabs expected:
- `work_with_us`
- `partner_with_us`
- `stay_connected`

Public path mapping:
- `find_out_whats_coming` routes to the existing `stay_connected` tab for continuity
- legacy `stay_connected` payloads are still accepted and normalized server-side

Important:
- do not delete the linked Google Doc, Google Sheet, or Google Slides reference files in this repo
- use `data-sources/the-tox-raleigh-outreach-sheet-reference.md` as the stable checked-in sheet reference
