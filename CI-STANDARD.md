# CI/CD standard (Roman, 2026-10-23)

Every repository under `rbediner` and `alliance-properties` follows this, for every agent, human and harness. This file is a
byte-identical copy of the canonical one in `rbediner/automation-estate` (`automations/CI-STANDARD.md`); never edit a copy,
change the canonical one and let the installer open the pull requests.

## Why

GitHub bills every job that starts as at least one whole minute, $0.008 on a private Linux runner (macOS bills 10 times,
Windows 2 times). A job skipped by a job-level `if:` is free. Measured for the 7 days to 2026-10-23 with
`scripts/actions-cost.py`: 9,410 billed minutes, $75.28, a 30-day pace of about $2,250. About 70% was Sunset Grove: one
job per issue comment (4,142 runs), full QA and mirrors on every push to every branch, one branch pushed 274 times. In the
estate, `main` was pushed 24 to 97 times per repository and the same check ran on the pull request and again on the merge.

## How it is enforced

1. **The check `ci-standard`.** `.github/workflows/ci-standard.yml` runs on every pull request. It lints only the workflow
   files that pull request changed, so old violations never block unrelated work; they print as warnings.
2. **The name is frozen.** The required check is named `ci-standard`. Renaming the job or the workflow's check blocks every pull
   request in that repository until the ruleset is edited. Do not rename it.
3. **A pull request cannot weaken its own checker.** The job runs the lint and reads `config.json` from the BASE branch, never
   from the pull request. A pull request that changes the lint, the config or this file is checked by the base version and must
   also pass the new version.
4. **A ruleset on the default branch** (and on each release branch) requires `ci-standard`. Repository admins can bypass it,
   because routines push data commits straight to `main`.
5. **The bypass is watched.** On a push to a protected branch that changes `.github/workflows/**`, the same job runs. On a
   violation it fails red and opens one P1 issue titled `[ci-standard] <rule> in <file>` (one per title), so the morning fixer
   and the daily estate status see it. Never use `gh pr merge --admin` to get a workflow change past this check.
6. **Local pre-push command.** Run `python3 .github/ci-standard/ci-cost-lint.py --changed` before pushing. Exit 1 means fix first.
7. **Every repo carries its own copy** (this file, `AGENTS.md`, `CLAUDE.md`, `.github/ci-standard/`, the workflow), so an agent
   on any account finds the standard with no access to the estate repo. New repositories start from `rbediner/repo-template`;
   a daily installer opens an install pull request in any repository that is missing the set.

## MUST rules (the lint blocks on these)

| ID | Rule | Why, with the number | Fix |
|---|---|---|---|
| CI001 | `push` runs only on the default branch or a declared release branch, and has a `paths:` filter. Branch checks run on `pull_request` only. | A push trigger with no branch filter ran full QA on a branch pushed 274 times. | Add `branches:` and `paths:` to `push`. |
| CI002 | Every `push` or `pull_request` workflow has a `concurrency:` group. Checks use `cancel-in-progress: true`. Deploys and writers use `false`, which still collapses queued runs to one. A release branch push is never cancelled. | Superseded runs keep billing; a cancelled deploy leaves production half-updated. | Add `concurrency:`; `true` for checks, `false` for deploys. |
| CI003 | A workflow started by a comment, issue, `workflow_run` or `repository_dispatch` filters every job with a job-level `if:`. | 4,142 runs in 7 days started a runner for every issue comment; a skipped job is free. | Add `if:` naming the event, label or command the job acts on. |
| CI004 | Every job has `timeout-minutes`, at most 15. More needs an exception. | A hung step bills up to 360 minutes. | Add `timeout-minutes: 10`. |
| CI005 | `runs-on` is Linux. | macOS bills 10 times, Windows 2 times. | Use `ubuntu-latest` or add an exception. |
| CI006 | A matrix has at most 3 legs. | Each leg is a job and bills a whole minute (a 30-leg matrix cost 446 minutes in 11 runs). | Fold legs into one job with steps. |
| CI007 | A schedule fires no more often than hourly. | An every-10-minute cron is 144 billed minutes a day even when idle. | Use an event trigger, or a Worker that starts the job only when there is work. |
| CI008 | The same check does not run on `pull_request` and again on the merge push, unless the workflow deploys or writes. | The estate ran every check twice per change. | Drop the `push` trigger. |
| CI000 | `config.json` is valid: every exception has a rule, a file, a reason and an unexpired `expires` date. | An exception without an end date is a permanent hole. | Fix or renew the exception with a reason. |

## SHOULD rules (warnings)

| ID | Rule | Why |
|---|---|---|
| CI101 | One job with steps instead of four or more tiny sibling jobs. | Three small jobs bill 3 minutes; one job with three steps bills 1. |
| CI102 | Batch tool calls: read and write several files per call, run one command that does the whole step. | Every call is model usage Roman pays for. |
| CI103 | Push once when ready; batch merges to the default branch (graph, ticket and doc touch-ups ride in the pull request they belong to). | One session pushed 234 times in three days to one pull request. |

Also expected, not lintable: **test only what you touch** (change-based selection; `NC-Courage` `scripts/qa/gates-for.py` and
Sunset Grove `scripts/select_tests.py` are the patterns), **look before you build** (search the repo for a tool that exists),
and **every report to Roman carries a cost line** (Actions runs or minutes triggered, API bursts, model used).

## Release branches

A repository whose release branch deploys (Sunset Grove: `codex/group-creatives-and-review`) declares it in `release_branches`.
The lint then allows `push` on it, and CI002 forbids an always-true `cancel-in-progress` on a push to it: only `pull_request` runs
cancel. A repository whose default branch is not `main` (for example `staging`) sets `default_branch`.

## Config: `.github/ci-standard/config.json`

```json
{
  "default_branch": "main",
  "release_branches": [],
  "deploy_workflows": [],
  "weekly_minute_budget": 300,
  "exceptions": [
    {"rule": "CI007", "file": "pulse.yml", "reason": "why this must be so", "expires": "2026-12-31"}
  ]
}
```

- `deploy_workflows`: workflow files that deploy or write; they are never cancelled (the lint also detects obvious ones).
- `weekly_minute_budget`: billed minutes allowed in a trailing 7 days; the daily cost check opens one P1 issue when a repo goes over.
- `exceptions`: a justified exception names the rule ID, the file, a plain reason and an ISO `expires` date. The lint fails on a
  missing field or an expired date. Review each one when it expires; do not just push the date out.

## The measure

`scripts/actions-cost.py` in `rbediner/automation-estate` runs daily and reports billed minutes per repository, workflow and branch.
A repository over its weekly budget gets a P1 issue naming the top workflow and branch. Fix the workflow, not the budget.
