# Backend QA Trigger SOP

This document is the repo-local source of truth for when to run cheap QA, targeted smoke QA, and the full live-staging backend validation pack for the Raleigh Premium Wellness site.

## Purpose

- preserve confidence without burning unnecessary tokens, time, or evidence churn
- keep routine development fast
- reserve expensive live-staging validation for real backend-risk changes
- give future Codex, Claude, and ChatGPT sessions a stable operating rule

## Testing Philosophy

- Cheap routine QA is the default because most commits do not change the backend risk surface.
- Targeted smoke QA is for changes that touch a specific risky area but do not justify re-proving the entire live backend stack.
- The full live-staging backend validation pack is a manual, evidence-generating release tool, not a per-build habit.
- Skipping the full pack on low-risk changes is cost control and signal discipline, not laziness.
- Confidence comes from matching the test depth to the actual change surface.

## QA Tiers

### 1. Cheap Routine QA

Use this for normal development, ordinary preview prep, and any change that does not alter live backend behavior.

Include:

- `npm run test:unit` when front-end logic or submission-related JavaScript changed
- `npm run qa:docs-gate` when release, handoff, or SOP docs changed
- `npm run test:workflow` when release workflow, docs contracts, or policy files changed
- `npm run qa:preview-smoke:local` or `npm run release:preflight:preview` for the smallest responsible preview gate
- lightweight local browser QA when UI behavior changed but the backend contract did not

Routine QA is expected on most branches and most `staging` promotions.
In the trigger matrix below, docs-only and release-governance edits are represented explicitly in the `Docs / Policy Gate` column so they are not misread as requiring no checks at all.

### 2. Targeted Smoke QA

Use this when one bounded area needs extra confidence, but rerunning the whole live-staging pack would mostly create duplicate proof.

Include only the checks that match the changed risk:

- one-path browser submission through the affected flow
- one-path direct POST to the live `/exec` endpoint when browser proof is unnecessary
- one row-write verification in the affected Google Sheet tab
- one notification email verification when notification behavior changed
- targeted GA4 / DebugView verification when analytics behavior changed
- focused error-state verification when the change touched failure handling or validation messaging

Targeted smoke QA should prove the changed behavior, not re-prove unrelated paths.

### 3. Full Live-Staging Backend Validation Pack

Use this only when the backend risk surface changed materially or when a milestone needs explicit backend-readiness proof.

The full pack means:

- published `staging` site uses the intended live `/exec` endpoint
- all three persona paths submit through the real backend
- each path writes to the correct Google Sheet tab with the expected structure
- at least one notification email proof is captured when email behavior is in scope
- success and relevant failure behavior are verified truthfully on the live staging site
- evidence is recorded in repo docs or dated evidence folders so future sessions can reuse it

This pack is intentionally expensive. Treat it as a sign-off artifact, not standard CI.

## Routine Development SOP

- Start with the smallest responsible gate.
- If the change is docs-only, run `npm run qa:docs-gate` and `npm run test:workflow`.
- If the change is front-end logic only, run the related unit tests plus lightweight browser QA.
- If the change is a normal preview promotion with no backend-risk changes, run `npm run release:preflight:preview` and stop there unless something looks wrong.
- Do not run the full live-staging backend pack just because a deploy happened.

## Targeted Smoke SOP

- Escalate from routine QA to targeted smoke when a specific risky surface changed.
- Test only the affected path or contract unless evidence shows a broader regression.
- Prefer a single-path browser smoke plus one direct backend proof over a full three-path rerun.
- Capture only the evidence needed to prove the changed behavior.

## Milestone Or Release Validation SOP

- Always run the normal release preflight and published-environment smoke checks for the release branch.
- Run the full live-staging backend validation pack before declaring backend readiness complete for a milestone release.
- If a release candidate includes backend-risk changes since the last signed-off live pack, rerun the full pack.
- If a release candidate is front-end-only and the backend lineage is unchanged, reuse the last valid backend proof set instead of regenerating it.

## Full-Pack Triggers

Run the full live-staging backend validation pack when any of the following is true:

- submission-flow code changed
- Apps Script backend code changed
- Google Sheets mapping, schema, header, or tab-routing logic changed
- notification email logic, recipient, subject, or body contract changed
- success or error state behavior tied to real backend outcomes changed
- analytics events tied to submission success or failure changed
- endpoint URL, deployment ID, script ownership, access model, or Google service ownership changed
- a real backend regression is suspected
- a milestone release candidate needs explicit backend-readiness sign-off

## Explicit Non-Triggers

The following do **not** require the full live-staging backend validation pack on their own:

- copy-only edits
- styling or layout changes with no submission-flow impact
- metadata, favicon, canonical, open-graph, or other share-surface updates
- docs-only changes
- analytics-only changes that do not alter submission success or failure semantics
- ordinary `staging` or `main` promotions where backend-related files and settings were untouched

## Trigger Matrix

| Change Type | Docs / Policy Gate | Unit Tests | Browser QA | Targeted Smoke | Full Live-Staging Pack |
|---|---|---|---|---|---|
| Docs-only changes | Yes | No | No | No | No |
| Docs/policy/SOP changes that affect release governance | Yes | No | No | No | No |
| Copy-only changes | No | No | Yes | No | No |
| Styling/layout-only changes | No | No | Yes | No | No |
| Metadata/share-surface changes | No | No | Yes | No | No |
| Analytics-only changes | No | Yes if logic changed | Yes | Yes | No, unless tied to submission success/failure |
| Submission-flow code changes | No | Yes | Yes | Yes | Yes |
| Apps Script backend changes | No | Yes if repo code changed | Optional | Yes | Yes |
| Google Sheets mapping changes | No | Yes if repo code changed | Optional | Yes | Yes |
| Notification email changes | No | Yes if repo code changed | Optional | Yes | Yes |
| Endpoint / deployment / ownership changes | No | No unless code changed | Yes | Yes | Yes |
| Suspected regression | No | Yes if code changed | Yes | Yes | Yes |
| Milestone release candidate | No | Yes | Yes | Yes | Yes |

## Current State Note

As of `2026-04-14`:

- the published staging site is live at `https://rbediner.github.io/raleigh-premium-wellness/staging/`
- the staging HTML currently points to the live Apps Script `/exec` endpoint
- the deployed Apps Script health endpoint is returning `ok: true`
- backend readiness is substantially complete, but some evidence capture and GA4 follow-up remain operational tasks

Because this SOP pass is documentation and policy work, it does **not** itself trigger the full live-staging backend validation pack.
