#!/usr/bin/env bash
# local-gate.sh: run this repository's checks on your own machine before you push (CI-STANDARD.md, rule CI010).
#
# Roman, 2026-11-11: "We are supposed to be testing our shit locally so that GitHub doesn't waste action minutes on
# testing our code. We do our own code review, we do our own tests, and we just deploy through Git." In the 7 days to
# 2026-11-11 the six estate repositories started 1,004 pull_request runs, each billed as at least a whole minute, mostly
# repeating checks the agent had already run. So checks run here, once, and GitHub only deploys from the default branch
# runs this same script once more, as the first step of any workflow that publishes (the release check).
#
# What it runs, in order:
#   1. the CI standard lint on the workflow files you changed (always);
#   2. every command listed in "local_gate" in .github/ci-standard/config.json, from the repository root.
# A repository with no "local_gate" list runs only the lint.
#
# Usage:   bash .github/ci-standard/local-gate.sh            (before every push)
#          bash .github/ci-standard/local-gate.sh --all      (lint every workflow; the release check runs this)
# Output:  the last line is the proof, for example
#            Local-Gate: pass 3f2a91c 2026-11-11T21:40:12Z
#          Put that line in the pull request body (or the commit message when you push straight to the default branch).
# Exit:    0 when everything passed, 1 when anything failed (fix it, then run it again; never push on a failure).
set -uo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "local-gate: not inside a git repository" >&2; exit 1; }
cd "$root" || exit 1
mode="--changed"
[ "${1:-}" = "--all" ] && mode=""

failed=0
echo "local-gate: CI standard lint ${mode:-(all workflows)}"
if ! python3 .github/ci-standard/ci-cost-lint.py $mode; then
  echo "local-gate: FAIL ci-cost-lint" >&2
  failed=1
fi

# Read the declared commands without jq (not every machine has it).
commands=$(python3 - <<'PY'
import json
try:
    cfg = json.load(open(".github/ci-standard/config.json", encoding="utf-8"))
except (OSError, ValueError):
    cfg = {}
for c in cfg.get("local_gate") or []:
    if isinstance(c, str) and c.strip():
        print(c.strip())
PY
)

if [ -n "$commands" ]; then
  while IFS= read -r cmd; do
    echo "local-gate: running: $cmd"
    if ! bash -c "$cmd"; then
      echo "local-gate: FAIL $cmd" >&2
      failed=1
    fi
  done <<< "$commands"
else
  echo "local-gate: no local_gate commands declared in .github/ci-standard/config.json (lint only)"
fi

sha=$(git rev-parse --short HEAD)
now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
if [ "$failed" -ne 0 ]; then
  echo "Local-Gate: FAIL $sha $now"
  exit 1
fi
echo "Local-Gate: pass $sha $now"
