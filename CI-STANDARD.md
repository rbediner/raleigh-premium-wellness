# CI/CD standard (Roman, 2026-10-23)

Every repository under `rbediner`, `North-Carolina-Courage`, `Agentic-Society-LLC`, `alliance-properties` and `pasteflowapp` follows this, for every agent, human and harness. This file is a
byte-identical copy of the canonical one in `rbediner/automation-estate` (`automations/CI-STANDARD.md`); never edit a copy,
change the canonical one and let the installer open the pull requests.

## Test locally, deploy through git (Roman, 2026-11-11). Read this first

Roman: *"We are supposed to be testing our shit locally so that GitHub doesn't waste action minutes on testing our code.
We do our own code review, we do our own tests, and we just deploy through Git."* Measured for the 7 days to 2026-11-11:
the six estate repositories started 1,004 `pull_request` runs (each billed as at least a whole minute) out of 3,674, and
Agentic Society's Slack-Agents alone started 908, mostly repeating checks the agent had already run on its own machine.

| Step | Who does it | Where |
|---|---|---|
| 1. Test | The agent, before every push: `bash .github/ci-standard/local-gate.sh` | Your machine or sandbox |
| 2. Review | The agent reads its own full diff before pushing; a change to a deploy, auth, money or workflow path also gets one second-model review (`/code-review` or a reviewer agent) | Your machine |
| 3. Prove | Paste the gate's last line, `Local-Gate: pass <sha> <time>`, into the pull request body (or the commit message when pushing straight to the default branch). Run the gate after your last commit, so the sha is the head | The pull request |
| 4. Merge and deploy | Merge; the deploy workflow runs on the default branch | GitHub, push to the default branch only |
| 5. Safety net | Once a night, in each repository that declares tests, `nightly-gate.yml` re-runs the gate on the default branch and checks that every pull request merged that day carried a pass line for its head. Anything red opens ONE issue; the morning fixer repairs it | GitHub, one short run a night, nothing on a quiet day |

- **No workflow starts on `pull_request` (CI010)**, except `ci-standard.yml`, whose job skips itself there. A job skipped by a
  job-level `if:` costs nothing, finishes at once and counts as a passing required check, so rulesets requiring `ci-standard`
  never make a merge wait.
- **What the gate runs:** the CI standard lint on the workflows you changed, then every command in `local_gate` in
  `.github/ci-standard/config.json` (for example `["python3 -m pytest -q", "node --test"]`). Test only what you touch where the
  repository has a change-based selector; the full suite runs for shared core code.
- **Never push on a red gate**, and never fake a pass line: the nightly gate compares it with the merged head commit.
- **Installing the safety net:** a repository that declares `local_gate` copies
  `rbediner/automation-estate/.github/ci-standard/nightly-gate.yml.tmpl` to `.github/workflows/nightly-gate.yml`, setting
  `__MINUTE__` to a minute of its own (staggered so the repositories do not all start at once).

## Why

GitHub bills every job that starts as at least one whole minute, $0.008 on a private Linux runner (macOS bills 10 times,
Windows 2 times). A job skipped by a job-level `if:` is free. Measured for the 7 days to 2026-10-23 with
`scripts/actions-cost.py`: 9,410 billed minutes, $75.28, a 30-day pace of about $2,250. About 70% was Sunset Grove: one
job per issue comment (4,142 runs), full QA and mirrors on every push to every branch, one branch pushed 274 times. In the
estate, `main` was pushed 24 to 97 times per repository and the same check ran on the pull request and again on the merge.

## How it is enforced

1. **The check `ci-standard`.** `.github/workflows/ci-standard.yml` answers on every pull request, but since 2026-11-11 its job
   skips itself there (CI010): the same lint runs locally inside `local-gate.sh` before the push. It lints only the workflow
   files a change touched, so old violations never block unrelated work; they print as warnings.
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
6. **Local pre-push command.** Run `bash .github/ci-standard/local-gate.sh` before pushing (it runs the lint and this
   repository's `local_gate` commands). Exit 1 means fix first. Its last line is the pass line the pull request carries.
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
| CI009 | Branch hygiene is declared and wired: `branch_hygiene` in `config.json` names the branch allowlist (it must cover the default and release branches and must not be `*`), a janitor workflow that exists, runs on a `schedule:` and archives under `refs/archive/branches/`, and, when a release branch is declared, a `release_gate` script that exists. A repository that has not declared it yet gets a warning on every pull request; once declared, a change to `config.json` or the janitor must keep it valid. | Sunset Grove reached 490 branches (115 `mirror-request/*`, 149 `claude/*`, 210 `codex/*`) with no protection on `main`. | Add the block and the janitor; see Branch hygiene below. |
| CI010 | No workflow starts on `pull_request` or `pull_request_target`, except `ci-standard.yml` (which skips itself there). Checks run locally with `local-gate.sh` before the push; GitHub deploys from the default branch and runs the nightly gate. | 1,004 pull_request runs in 7 days in the six estate repositories, and 908 in one Agentic Society repository, mostly repeating the agent's own checks (2026-11-11). | Drop the `pull_request` trigger and add the command to `local_gate` in `config.json`. |
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

## Weekly minutes estimate (wg-445, 2026-11-01)

When a pull request adds or edits a workflow file, the `ci-standard` job posts one comment (replaced on each push) with the estimated billed minutes per week: one minute per job, matrix legs counted, schedules exact (a 10 minute cron shows 1,008), and assumed counts for `pull_request` (5 runs a week) and `push` (7 runs a week). It is `ci-cost-lint.py --estimate-out`; it never blocks.

## Branch hygiene (Roman, 2026-10-31)

Roman, after seeing 490 branches in Sunset Grove: "i dont ever want to see any branches there unless they are active", "i want
branches to be deleted once they are merged!", enforced "at git level! as part of each release gate". Every repository:

1. **Only active branches exist on GitHub.** Active means: the default branch, a declared release branch, a named system branch
   listed in `allowed_branches`, the head of an open pull request, or a branch with a commit in the last 24 hours. Nothing else.
2. **A branch is deleted when it is merged.** `delete_branch_on_merge` is on in the repository settings, so a merged pull request
   deletes its head. A release flow that merges branches in a batch (not through pull requests) deletes each merged branch
   right after its push to the release branch succeeds.
3. **A repository ruleset restricts branch creation to the allowlist.** The ruleset targets every branch except the
   `branch_hygiene.allowed_branches` patterns and applies the "Restrict creations" rule, so a branch outside the allowlist cannot
   be created. The allowlist names prefixes (`claude/*`, `codex/*`, `mirror-request/*`), never `*`.
4. **A daily janitor deletes inactive branches.** A scheduled workflow (daily, within CI007) lists the branches, keeps every active
   one (rule 1), and deletes the rest. Before deleting a branch whose tip is not merged into the default or release branch, it
   pushes that tip to `refs/archive/branches/<name>`, so no unmerged work is lost and `git fetch origin
   refs/archive/branches/<name>` restores it. A merged branch is deleted with no archive.
5. **The release gate refuses a release push while merged branches linger.** The repository's release gate (named in
   `branch_hygiene.release_gate`) lists the remote branches before it allows a push to the release branch, and exits non-zero
   naming every branch already merged that still exists. Delete them (rule 2) and push again.

`ci-cost-lint.py` checks the parts it can see without calling the API (CI009): the allowlist is declared and covers the default
and release branches, the janitor workflow exists, is scheduled and archives under `refs/archive/branches/`, and the release gate
script exists when a release branch is declared. The live settings (`delete_branch_on_merge`, the ruleset, the branch count) are
checked by the janitor and the release gate, which have the token.

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
  ],
  "branch_hygiene": {
    "allowed_branches": ["main", "claude/*", "codex/*"],
    "janitor_workflow": "branch-janitor.yml",
    "release_gate": ""
  }
}
```

- `deploy_workflows`: workflow files that deploy or write; they are never cancelled (the lint also detects obvious ones).
- `weekly_minute_budget`: billed minutes allowed in a trailing 7 days; the daily cost check opens one P1 issue when a repo goes over.
- `exceptions`: a justified exception names the rule ID, the file, a plain reason and an ISO `expires` date. The lint fails on a
  missing field or an expired date. Review each one when it expires; do not just push the date out.
- `branch_hygiene`: `allowed_branches` (names or `fnmatch` patterns the creation ruleset allows), `janitor_workflow` (a file in
  `.github/workflows/`), `release_gate` (repository path of the script that refuses a release push while merged branches linger;
  required when `release_branches` is not empty, otherwise `""`). See Branch hygiene.

## The measure

`scripts/actions-cost.py` in `rbediner/automation-estate` runs daily and reports billed minutes per repository, workflow and branch.
A repository over its weekly budget gets a P1 issue naming the top workflow and branch. Fix the workflow, not the budget.
