# Apps Script Version-Control Runbook

Purpose:
- keep Google Apps Script changes reviewable in git
- avoid drift between local source and live deployed version
- make rollback and debugging predictable

## Source of Truth

- Local source file: `integrations/google-sheets-submissions/Code.js`
- Local manifest: `integrations/google-sheets-submissions/appsscript.json`
- Live deployment URL stays stable, but deployment **version** must be advanced for code changes to take effect

## Safe Change Workflow

1. Edit `Code.js` locally in the repo.
2. Run tests:
   - `npm run test:unit`
3. Run auth preflight:
   - `npm run qa:clasp-auth`
4. Deploy Apps Script update from the Apps Script UI as a **new version**.
5. Verify the live `/exec` health response includes expected `available_paths`.
6. Run live integration QA:
   - `npm run qa:backend:live -- --endpoint <exec-url> --spreadsheet-id <sheet-id>`
7. Commit repo changes with deployment notes.

## Why This Matters

- Saving code in Apps Script does not always mean the live web app runs the latest code.
- Deploying a new version is required to promote runtime behavior.
- The version number is part of the operational evidence for backend QA.

## Optional `clasp` Workflow

`clasp` can sync Apps Script files between local and Google, but deployment still requires versioning.

Typical commands (from `integrations/google-sheets-submissions`):

```bash
npx @google/clasp login --no-localhost
npx @google/clasp pull
npx @google/clasp push
npx @google/clasp deployments
```

Notes:
- Use the operational owner account: `roman.bediner@cormanity.com`.
- If auth behaves unexpectedly, re-auth before trusting deployment actions.
- Keep UI-only edits to emergency fixes; back-port those edits into local `Code.js` immediately after.

## Auth Failure Recovery SOP (`clasp`)

Trigger this SOP when:
- `npx @google/clasp push` fails with auth errors
- `~/.clasprc.json` shows `tokens: {}`
- terminal repeatedly shows browser/login loop confusion

Step-by-step:

1. Move to the Apps Script integration directory:
   - `cd integrations/google-sheets-submissions`
2. Clear stale auth:
   - `npx @google/clasp logout`
3. Start manual login flow:
   - `npx @google/clasp login --no-localhost`
4. Complete Google auth in browser as `roman.bediner@cormanity.com`.
5. When browser redirects to `http://localhost:8888/...`, copy the **entire URL** from the address bar.
6. Paste that full URL into terminal at the active `clasp` prompt.
7. Verify auth:
   - `npm run qa:clasp-auth`
8. Continue normal workflow:
   - `npx @google/clasp push`
   - `npx @google/clasp deployments`

Common mistake to avoid:
- Do not paste only the raw `code=...` value.
- Do not paste the URL at a normal shell prompt (causes `zsh parse error near '&'`).
