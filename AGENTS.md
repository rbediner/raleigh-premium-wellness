# The Tox - Raleigh Outreach Site
## Google Drive drift (ALL agents & tools — read this)

This repo is checked out inside **Google Drive** and synced across multiple machines. Google Drive creates conflict-copies of files (names ending in ` 2`, ` 3`, …) — **including inside `.git/objects` and `.git/refs`** — which corrupt the repository. This has caused real breakage.

**Before starting work, and before committing, clean the drift:**

```
scripts/clean-drive-drift.sh --fix      # remove conflict-copies + verify with git fsck
scripts/clean-drive-drift.sh --check    # report only (exit 1 if any found)
```

- Runs automatically via git hooks (`pre-commit`, `post-merge`, `post-checkout`) — activated by `git config core.hooksPath .githooks` (verify with `git config core.hooksPath`; it should print `.githooks`).
- Dependency-free (bash + git) — works for Codex, Claude, Cursor, or a human. Claude also runs it at session start via `.claude/settings.json`.
- **Never commit a file whose name ends in ` 2`/` 3` — it is Drive junk, not a real file.**

<!-- ci-standard:begin -->
## CI/CD standard (Roman, 2026-10-23; local testing 2026-11-11). Binding.

Read `CI-STANDARD.md` at the repository root before you push code or change anything under `.github/workflows/`.

- **Test locally, deploy through git (CI010, 2026-11-11).** Before every push run `bash .github/ci-standard/local-gate.sh`
  (the CI standard lint plus this repository's `local_gate` commands from `.github/ci-standard/config.json`). Never push on a
  red gate. Read your own full diff before pushing; a deploy, auth, money or workflow change also gets one second-model review.
- **Prove it.** Put the gate's last line, `Local-Gate: pass <sha> <time>`, in the pull request body (or the commit message when
  you push straight to the default branch). Run it after your last commit.
- **Release check.** Every workflow that publishes runs `bash .github/ci-standard/local-gate.sh --all` as its first step and
  publishes nothing on a failure: the combined code is tested once, on GitHub, right before it goes live.
- **GitHub does not test pull requests.** No workflow starts on `pull_request` except `ci-standard.yml`, whose job skips itself
  there (free, and it still satisfies the required check). GitHub only runs the release check and the deploy.
- Workflow changes go through a pull request. Never `gh pr merge --admin`, and never push a workflow change straight to the
  default branch. The required check is named `ci-standard`; its name is frozen.
- The rules that matter most: no pull_request runs (CI010); push triggers only on the default or a release branch with a
  `paths:` filter (CI001); a `concurrency:` group on every push workflow (CI002); a job-level `if:` on comment, issue,
  workflow_run and repository_dispatch jobs (CI003); `timeout-minutes` on every job (CI004); no schedule more often than hourly (CI007).
- Branch hygiene (CI009): only active branches exist on GitHub. Delete your branch once it is merged, never leave one idle, and create
  branches only under the prefixes in `branch_hygiene.allowed_branches`. A daily janitor archives unmerged tips under
  `refs/archive/branches/<name>` and deletes inactive branches; the release gate refuses a release push while merged branches linger.
- Clean up before you stop (CI104): merge or close your own pull request and let its branch be deleted; never leave a branch you made
  without an open PR. Unmerged work is never deleted automatically; the daily sweep lists anything idle 3 days for the morning fixer.
- Push once when ready, batch merges, test only what you touch, and put a cost line (Actions minutes, API calls, model) in every report.
- `CI-STANDARD.md` and the files under `.github/ci-standard/` (except `config.json`) are byte copies from `rbediner/automation-estate`.
  Do not edit them here; change the canonical copy there and the installer opens the pull requests.
<!-- ci-standard:end -->
