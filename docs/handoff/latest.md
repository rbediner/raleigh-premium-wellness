# Latest Handoff

Source branch: `main`

Source commit: `6873428f7f02d0b508f12c87d8993bba1a015f04`

Workflow status:

- Release workflow scaffold added locally.
- Preview is designed to publish from `staging` to `/staging/` on the `gh-pages` branch.
- Production is designed to publish from `main` to the root of the `gh-pages` branch.
- Production is protected so the deployed `main` commit must already exist on `staging`.
- Local QA and workflow contract tests are part of the repo now.

Recent release changes:

- Added a GitHub Pages staging/production release model.
- Added repo-local SOP docs, QA docs, and session handoff docs.
- Added preview/prod build scripts and deploy publication scripts.
- Added policy tests that protect the branch roles, workflow files, and preview noindex rules.

Operator notes:

- Do not use `main` as a working branch.
- Review preview on `staging` before promoting anything to `main`.
- GitHub Pages must be enabled once in repository settings with `gh-pages` as the source branch.
- The Google Sheets + email-notification bridge is still a separate next implementation step.
