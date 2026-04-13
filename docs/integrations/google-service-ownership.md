# Google Service Ownership

Purpose:
- keep Google account ownership consistent across GA4, Google Sheets, and Apps Script work
- prevent future Codex sessions from authenticating the wrong Google account for the wrong system
- document the one-time setup steps needed on a new machine

## Ownership Policy

- Google Ads and GA4 measurement work should stay under `rbediner@gmail.com`
- Google Sheets, Apps Script, and other operational Google workspace work should use `roman.bediner@cormanity.com`

Important:
- the `roman.bediner@cormanity.com` address is recorded here exactly as requested in chat
- verify the spelling before provisioning or re-authenticating a new machine

## BL-1 Implication

- do not continue the form-submission Apps Script setup under the GA4 / Ads account
- if a local machine authenticated `clasp` with the wrong Google account, log out and re-authenticate with the correct one before deploying or updating the script

## New Machine Setup

1. Use the repo startup flow in `README.md`
2. Install Node.js and align to `.nvmrc`
3. Run `npx playwright install chromium`
4. Enable the Apps Script API for the operational Google account at:
   - `https://script.google.com/home/usersettings`
5. Authenticate `clasp` with the operational Google account only:

```bash
npx @google/clasp login
```

6. If `clasp` was authenticated with the wrong account, clear it first:

```bash
npx @google/clasp logout
```

7. Deploy or update the Apps Script web app from `integrations/google-sheets-submissions/`
8. Set the GitHub repository variable `FORM_SUBMISSION_ENDPOINT_URL` to the deployed `/exec` URL

## Why This Split Exists

- Ads and analytics access often live under a marketing or owner Gmail account
- Sheets and Apps Script operations are better tied to the operating workspace account that owns the business workflow
- keeping the split explicit reduces silent permission errors and cross-account confusion
