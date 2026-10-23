#!/usr/bin/env python3
"""ci-cost-lint.py: check a repository's .github/workflows/*.yml against the CI/CD standard (CI-STANDARD.md).

Roman, 2026-10-23: "our CI/CD process is amateur". GitHub bills every job that starts as at least one whole minute
($0.008 on a private Linux runner; macOS bills 10 times, Windows 2 times) and a job skipped by a job-level `if:` is free.
Every rule below stops a runner starting for no reason.

MUST RULES (each ID is stable, is named in CI-STANDARD.md, and carries a one-line fix hint):
  CI001  push triggers only on the default or a declared release branch, with a paths filter
  CI002  concurrency group on every push and pull_request workflow; checks cancel superseded runs, deploys and writers never do
  CI003  comment, issue, workflow_run and repository_dispatch workflows filter every job with a job-level `if:`
  CI004  every job has timeout-minutes, at most 15
  CI005  runs-on is Linux
  CI006  matrix size is at most 3
  CI007  schedules fire no more often than hourly
  CI008  no duplicate run of the same check on pull_request and the merge push, unless the workflow deploys or writes
  CI000  the config and its exceptions are valid (every exception has rule, file, reason and an unexpired date)
SHOULD RULES (warnings, never block):
  CI101  one job with steps instead of four or more tiny sibling jobs
  CI102  batch tool calls (agent behaviour, not lintable; named in the standard)
  CI103  push once when ready (agent behaviour, not lintable; named in the standard)

CONFIG: .github/ci-standard/config.json beside this file (same folder).
  {"default_branch": "main", "release_branches": [], "deploy_workflows": [], "weekly_minute_budget": 300,
   "exceptions": [{"rule": "CI007", "file": "x.yml", "reason": "why", "expires": "2026-12-31"}]}
An exception without a reason or an expiry date, or past its date, is a CI000 error and stops applying.

MODES
  default            every workflow file; any error exits 1
  --changed          only workflow files changed by your branch block (git diff against the default branch, plus uncommitted
                     work); existing violations in other files print as warnings. This is the local pre-push command.
  --changed-list F   same, with the changed paths read from file F (what the CI job passes)
  --report-only      print everything, always exit 0
  --json-out F       also write the findings as JSON
  --open-issues R    (push to a protected branch) open one P1 issue per violation in repo R via the gh CLI
Never contacts the network except with --open-issues. Dependency-free: it carries its own small YAML reader for the subset
workflows use, checked against PyYAML in test_ci_cost_lint.py.
"""
import argparse, datetime, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CONFIG = os.path.join(HERE, "config.json")
MAX_TIMEOUT = 15
MAX_MATRIX = 3
MUST_IDS = ["CI000", "CI001", "CI002", "CI003", "CI004", "CI005", "CI006", "CI007", "CI008"]
FIX = {
    "CI001": "limit `push` to the default or release branch and add a `paths:` list; run branch checks on `pull_request` only",
    "CI002": "add a top-level `concurrency:` with a group; checks `cancel-in-progress: true`, deploys and writers `false`",
    "CI003": "add a job-level `if:` that is false for events the job ignores (a skipped job is free)",
    "CI004": "add `timeout-minutes:` of 15 or less to the job (an exception is needed for more)",
    "CI005": "use `runs-on: ubuntu-latest` (macOS bills 10 times, Windows 2 times) or add an exception with a reason",
    "CI006": "cut the matrix to 3 legs or fewer, or fold the legs into one job with steps; otherwise add an exception",
    "CI007": "schedule no more often than hourly; prefer an event trigger or a Worker that starts the job only when there is work",
    "CI008": "drop the `push` trigger (the pull_request run already checked it) unless the workflow deploys or writes",
    "CI000": "fix .github/ci-standard/config.json: every exception needs rule, file, reason and a future ISO `expires` date",
    "CI101": "merge the small jobs into one job with several steps (each job bills a whole minute)",
}

FILTERED_EVENTS = {"issue_comment", "issues", "pull_request_review", "pull_request_review_comment", "workflow_run",
                   "repository_dispatch", "discussion", "discussion_comment", "check_run", "check_suite", "label", "status"}
PR_EVENTS = {"pull_request", "pull_request_target"}
WRITER_PATTERN = re.compile(
    r"git\s+push|wrangler\s+(deploy|publish)|\bdeploy|gh\s+(release|pr\s+(merge|create))|drive-writer|upload-pages|"
    r"deploy-pages|\bpublish|gcloud\s+(run|app)\s+deploy|firebase\s+deploy|git-auto-commit|peaceiris|push:\s*true|"
    r"gh\s+api\s+.*(-X|--method)\s+(POST|PUT|PATCH|DELETE)|gh\s+workflow\s+run", re.I)


# ----------------------------------------------------------------------------- minimal YAML subset parser
class YamlError(Exception):
    pass


def _strip_comment(s):
    out, q = [], None
    for i, ch in enumerate(s):
        if q:
            if ch == q:
                q = None
        elif ch in "\"'" and (i == 0 or s[i - 1] in " \t:[{,-"):
            q = ch
        elif ch == "#" and (i == 0 or s[i - 1] in " \t"):
            break
        out.append(ch)
    return "".join(out).rstrip()


def _balanced(s):
    depth, q = 0, None
    for ch in s:
        if q:
            if ch == q:
                q = None
        elif ch in "\"'":
            q = ch
        elif ch in "[{":
            depth += 1
        elif ch in "]}":
            depth -= 1
    return depth <= 0


def _tokenize(text):
    """Return a list of (indent, content). Block scalars and multi-line flow collections are folded into one token."""
    raw = text.replace("\t", "    ").split("\n")
    toks, i = [], 0
    while i < len(raw):
        line = raw[i]
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped in ("---", "..."):
            i += 1
            continue
        indent = len(line) - len(line.lstrip(" "))
        content = _strip_comment(line.strip())
        key_indent = indent + 2 if content.startswith("- ") and _split_key(content[1:].strip()) else indent
        # block scalar: the value part ends with | or > (plus chomp / indent indicators)
        if re.search(r"(^|[:\s])[|>][+\-0-9]*$", content) and (content.endswith(("|", ">")) or re.search(r"[|>][+\-0-9]+$", content)):
            head = re.sub(r"\s*[|>][+\-0-9]*$", "", content)
            body, j = [], i + 1
            while j < len(raw):
                nxt = raw[j]
                if nxt.strip() == "":
                    body.append("")
                    j += 1
                    continue
                ni = len(nxt) - len(nxt.lstrip(" "))
                if ni <= key_indent:
                    break
                body.append(nxt.strip())
                j += 1
            while body and body[-1] == "":
                body.pop()
            toks.append((indent, head + " " + json.dumps("\n".join(body)) if head else json.dumps("\n".join(body)), True))
            i = j
            continue
        # multi-line flow collection
        m = re.search(r"(^|:\s|-\s)([\[{].*)$", content)
        if m and not _balanced(m.group(2)):
            j = i + 1
            while j < len(raw) and not _balanced(content[content.index(m.group(2)):]):
                content += " " + _strip_comment(raw[j].strip())
                j += 1
            i = j
        else:
            i += 1
        toks.append((indent, content, False))
    return toks


_KEY_RE = re.compile(r"""^(?:"([^"]*)"|'([^']*)'|([^\s"'\[\]{},#&*!|>%@`:][^:]*?))\s*:(?:\s+(.*))?$""")


def _split_key(content):
    m = _KEY_RE.match(content)
    if not m:
        return None
    key = m.group(1) if m.group(1) is not None else m.group(2) if m.group(2) is not None else m.group(3)
    return key.strip(), (m.group(4) if m.group(4) is not None else "")


def _flow_split(s):
    parts, depth, q, cur = [], 0, None, []
    for ch in s:
        if q:
            cur.append(ch)
            if ch == q:
                q = None
        elif ch in "\"'":
            q = ch
            cur.append(ch)
        elif ch in "[{":
            depth += 1
            cur.append(ch)
        elif ch in "]}":
            depth -= 1
            cur.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(cur).strip())
            cur = []
        else:
            cur.append(ch)
    tail = "".join(cur).strip()
    if tail:
        parts.append(tail)
    return parts


def _scalar(s):
    s = s.strip()
    if s == "" or s in ("~", "null"):
        return None
    if s.startswith('"') and s.endswith('"') and len(s) >= 2:
        try:
            return json.loads(s)
        except ValueError:
            return s[1:-1]
    if s.startswith("'") and s.endswith("'") and len(s) >= 2:
        return s[1:-1].replace("''", "'")
    if s.startswith("[") and s.endswith("]"):
        return [_scalar(p) for p in _flow_split(s[1:-1])]
    if s.startswith("{") and s.endswith("}"):
        out = {}
        for p in _flow_split(s[1:-1]):
            kv = _split_key(p)
            if kv:
                out[kv[0]] = _scalar(kv[1])
        return out
    return s


def _parse_block(toks, i, indent):
    if i >= len(toks):
        return None, i
    if toks[i][1].startswith("- ") or toks[i][1] == "-":
        return _parse_list(toks, i, toks[i][0])
    return _parse_map(toks, i, toks[i][0])


def _parse_map(toks, i, indent):
    out = {}
    while i < len(toks) and toks[i][0] == indent and not toks[i][1].startswith("- "):
        kv = _split_key(toks[i][1])
        if not kv:
            raise YamlError("cannot read mapping line: %r" % toks[i][1])
        key, rest = kv
        i += 1
        if rest.strip() == "":
            if i < len(toks) and (toks[i][0] > indent or (toks[i][0] == indent and toks[i][1].startswith("- "))):
                val, i = _parse_block(toks, i, toks[i][0])
            else:
                val = None
        else:
            val = _scalar(rest)
        out[key] = val
    return out, i


def _parse_list(toks, i, indent):
    out = []
    while i < len(toks) and toks[i][0] == indent and (toks[i][1].startswith("- ") or toks[i][1] == "-"):
        content = toks[i][1][1:].strip()
        if content == "":
            i += 1
            if i < len(toks) and toks[i][0] > indent:
                val, i = _parse_block(toks, i, toks[i][0])
            else:
                val = None
            out.append(val)
            continue
        kv = _split_key(content)
        if kv and not (content.startswith(("[", "{"))):
            # an inline mapping starting on the dash line; its siblings sit at indent + 2 (after "- ")
            sub_indent = indent + (len(toks[i][1]) - len(toks[i][1][1:].lstrip()) )
            sub = [(sub_indent, content, toks[i][2])]
            j = i + 1
            while j < len(toks) and toks[j][0] >= sub_indent and not (toks[j][0] == indent):
                sub.append(toks[j])
                j += 1
            val, _ = _parse_map(sub, 0, sub_indent)
            out.append(val)
            i = j
        else:
            out.append(_scalar(content))
            i += 1
    return out, i


def parse_yaml(text):
    toks = _tokenize(text)
    if not toks:
        return {}
    val, i = _parse_block(toks, 0, toks[0][0])
    if i != len(toks):
        raise YamlError("trailing content near %r" % (toks[i][1],))
    return val




# ----------------------------------------------------------------------------- helpers over a parsed workflow
def triggers_of(doc):
    """Normalise the `on:` key (string, list or map) to {event: config dict}."""
    on = doc.get("on", doc.get(True))
    if isinstance(on, str):
        return {on: {}}
    if isinstance(on, list):
        return {str(e): {} for e in on}
    if isinstance(on, dict):
        return {str(k): (v if isinstance(v, dict) else {}) for k, v in on.items()}
    return {}


def as_list(v):
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


def _expand_cron_field(field, lo, hi):
    vals = set()
    for part in field.split(","):
        step = 1
        if "/" in part:
            part, s = part.split("/", 1)
            step = max(int(s), 1)
        if part in ("*", ""):
            a, b = lo, hi
        elif "-" in part:
            a, b = (int(x) for x in part.split("-", 1))
        else:
            a = int(part)
            b = hi if step > 1 else a
        vals.update(range(a, b + 1, step))
    return sorted(v for v in vals if lo <= v <= hi)


def cron_fires_per_day(cron):
    """Sorted minute-of-day list for one matching day. Day-of-week and month limits only reduce the count."""
    parts = cron.split()
    if len(parts) != 5:
        raise ValueError("not a five field cron: %r" % cron)
    mins = _expand_cron_field(parts[0], 0, 59)
    hrs = _expand_cron_field(parts[1], 0, 23)
    return sorted(h * 60 + m for h in hrs for m in mins)


def min_gap_minutes(times):
    if len(times) < 2:
        return 1440
    gaps = [b - a for a, b in zip(times, times[1:])] + [times[0] + 1440 - times[-1]]
    return min(gaps)


def _code_only(text):
    """The workflow text without comment lines, so a word in a comment never makes a workflow look like a deploy."""
    return "\n".join(l for l in text.splitlines() if not l.strip().startswith("#"))


def is_writer(doc, text, listed=False):
    """True when the workflow deploys or writes: a deploy workflow is never cancelled and may run on the merge push."""
    if listed:
        return True
    perms = []

    def collect(p):
        if isinstance(p, dict):
            perms.extend(str(v) for v in p.values())
        elif isinstance(p, str):
            perms.append(p)
    collect(doc.get("permissions"))
    for job in (doc.get("jobs") or {}).values():
        if isinstance(job, dict):
            collect(job.get("permissions"))
    if any("write" in p and "read" not in p for p in perms):
        return True
    return bool(WRITER_PATTERN.search(_code_only(text)))


def matrix_of(job):
    strat = job.get("strategy") if isinstance(job, dict) else None
    m = strat.get("matrix") if isinstance(strat, dict) else None
    return m if isinstance(m, dict) else {}


def matrix_size(job):
    m = matrix_of(job)
    if not m:
        return 1
    n = 1
    for k, v in m.items():
        if k in ("include", "exclude"):
            continue
        if isinstance(v, list):
            n *= max(len(v), 1)
    inc = m.get("include")
    if isinstance(inc, list):
        n += len(inc)
    return n


def runs_on_values(job):
    ro = job.get("runs-on")
    vals = []
    for item in as_list(ro) if not isinstance(ro, dict) else as_list(ro.get("labels")) + as_list(ro.get("group")):
        s = str(item)
        m = re.fullmatch(r"\$\{\{\s*matrix\.([\w\-]+)\s*\}\}", s.strip())
        if m:
            vals.extend(str(x) for x in as_list(matrix_of(job).get(m.group(1))))
            for inc in as_list(matrix_of(job).get("include")):
                if isinstance(inc, dict) and m.group(1) in inc:
                    vals.append(str(inc[m.group(1)]))
        else:
            vals.append(s)
    return vals


def concurrency_of(doc, jobs):
    c = doc.get("concurrency")
    if not c:
        for j in jobs.values():
            if isinstance(j, dict) and j.get("concurrency"):
                c = j["concurrency"]
                break
    if isinstance(c, str):
        c = {"group": c}
    return c if isinstance(c, dict) else None


def cancel_state(conc):
    """'true', 'false' or 'expr' (a runtime expression: cancels on some events only)."""
    v = conc.get("cancel-in-progress") if conc else None
    if v is None:
        return "false"
    s = str(v).strip().lower()
    if s in ("true", "false"):
        return s
    return "expr"


# ----------------------------------------------------------------------------- the rules
class Finding:
    def __init__(self, repo, workflow, rule, severity, message):
        self.repo, self.workflow, self.rule, self.severity, self.message = repo, workflow, rule, severity, message
        self.excepted = None      # reason, when an unexpired exception covers it
        self.existing = False     # in changed mode: a file this change did not touch (a warning, never blocks)

    @property
    def blocking(self):
        return self.severity == "error" and self.excepted is None and not self.existing

    def as_dict(self):
        return {"repo": self.repo, "workflow": self.workflow, "rule": self.rule, "severity": self.severity,
                "message": self.message, "fix": FIX.get(self.rule, ""), "excepted": self.excepted,
                "existing": self.existing, "blocking": self.blocking}


def lint_workflow(repo, name, text, cfg):
    out = []
    default = cfg.get("default_branch") or "main"
    release = list(cfg.get("release_branches") or [])
    allowed_branches = {default} | set(release) | ({"master"} if default == "main" else set())
    listed = name in (cfg.get("deploy_workflows") or [])

    def add(rule, sev, msg):
        out.append(Finding(repo, name, rule, sev, msg))

    try:
        doc = parse_yaml(text)
    except (YamlError, ValueError, IndexError) as exc:
        add("CI000", "error", "workflow could not be read by the linter: %s" % exc)
        return out
    if not isinstance(doc, dict):
        add("CI000", "error", "workflow is not a mapping")
        return out

    trig = triggers_of(doc)
    jobs = doc.get("jobs") if isinstance(doc.get("jobs"), dict) else {}
    writer = is_writer(doc, text, listed)
    push = trig.get("push")
    pr = any(e in trig for e in PR_EVENTS)
    here = ", ".join([default] + release)

    # CI001
    if push is not None:
        branches, tags = as_list(push.get("branches")), as_list(push.get("tags"))
        if not branches and not tags:
            add("CI001", "error", "`push` has no branches filter: it runs on a push to every branch (allowed: %s)" % here)
        elif branches:
            bad = [str(b) for b in branches if b not in allowed_branches]
            if bad:
                add("CI001", "error", "`push` runs on %s; only %s are allowed" % (", ".join(bad), here))
        if not push.get("paths") and not push.get("paths-ignore") and not (tags and not branches):
            add("CI001", "error", "`push` has no paths / paths-ignore filter: every push to the branch starts this workflow")

    # CI002
    conc = concurrency_of(doc, jobs)
    if push is not None or pr:
        if not conc or not conc.get("group"):
            add("CI002", "error", "no `concurrency` group: superseded and queued runs all keep billing")
        else:
            cs = cancel_state(conc)
            if writer or listed:
                if cs == "true":
                    add("CI002", "error", "cancel-in-progress is always true on a workflow that deploys or writes: a cancelled "
                        "run can leave a half-applied change (cancel only pull_request runs, or use false)")
            elif cs == "false":
                add("CI002", "error", "the group never cancels a superseded run: set `cancel-in-progress: true` "
                    "(or `${{ github.event_name == 'pull_request' }}`)")
            if push is not None and cs == "true" and set(map(str, as_list(push.get("branches")))) & set(release):
                add("CI002", "error", "cancel-in-progress is always true on a push to a release branch (%s): a cancelled "
                    "deploy leaves production half-updated" % ", ".join(release))

    # CI003
    fired = sorted(e for e in trig if e in FILTERED_EVENTS)
    if fired:
        for jname, job in jobs.items():
            if isinstance(job, dict) and job.get("if") is None and not job.get("needs"):
                add("CI003", "error", "job `%s` has no job-level `if:` but the workflow starts on %s: a runner starts and "
                    "bills a minute for every event, even ones it ignores" % (jname, ", ".join(fired)))

    # CI004, CI005, CI006
    for jname, job in jobs.items():
        if not isinstance(job, dict):
            continue
        if job.get("uses"):
            continue
        tm = job.get("timeout-minutes")
        if tm is None:
            add("CI004", "error", "job `%s` has no timeout-minutes: a hung step bills up to 360 minutes" % jname)
        else:
            try:
                if float(str(tm)) > MAX_TIMEOUT:
                    add("CI004", "error", "job `%s` allows %s minutes; the ceiling is %d" % (jname, tm, MAX_TIMEOUT))
            except ValueError:
                pass  # an expression: cannot be checked here
        bad_os = [v for v in runs_on_values(job) if re.search(r"macos|windows", v, re.I)]
        if bad_os:
            add("CI005", "error", "job `%s` runs on %s: macOS bills 10 times and Windows 2 times the Linux price" %
                (jname, ", ".join(sorted(set(bad_os)))))
        n = matrix_size(job)
        if n > MAX_MATRIX:
            add("CI006", "error", "job `%s` expands to a %d-way matrix (ceiling %d): each leg bills a whole minute" %
                (jname, n, MAX_MATRIX))

    # CI007
    on_raw = doc.get("on", doc.get(True))
    if isinstance(on_raw, dict) and isinstance(on_raw.get("schedule"), list):
        for item in on_raw["schedule"]:
            cron = str(item.get("cron")) if isinstance(item, dict) and item.get("cron") else None
            if not cron:
                continue
            try:
                times = cron_fires_per_day(cron)
            except ValueError as exc:
                add("CI000", "error", "cron not readable: %s" % exc)
                continue
            gap = min_gap_minutes(times)
            if gap < 60:
                add("CI007", "error", "cron `%s` fires every %d minutes (%d times a day, about %d billed minutes a day)"
                    % (cron, gap, len(times), len(times)))

    # CI008
    if push is not None and pr and not writer:
        add("CI008", "error", "runs on pull_request and again on the merge push and neither deploys nor writes: "
            "the second run repeats the first")

    # CI101
    tiny = [j for j, jd in jobs.items() if isinstance(jd, dict) and len(as_list(jd.get("steps"))) <= 3 and not jd.get("uses")
            and matrix_size(jd) == 1]
    if len(jobs) >= 4 and len(tiny) >= 4:
        add("CI101", "warning", "%d jobs of three steps or fewer (%s): each starts a runner and bills a whole minute"
            % (len(tiny), ", ".join(tiny[:6])))
    return out


# ----------------------------------------------------------------------------- config and exceptions
def today():
    env = os.environ.get("CI_STANDARD_TODAY")
    return datetime.date.fromisoformat(env) if env else datetime.date.today()


def load_config(path):
    """Return (config dict, problems). A missing file is an empty config; unreadable JSON is a problem."""
    if not path or not os.path.isfile(path):
        return {}, []
    try:
        with open(path, encoding="utf-8") as fh:
            cfg = json.load(fh)
    except (ValueError, OSError) as exc:
        return {}, ["config.json cannot be read: %s" % exc]
    if not isinstance(cfg, dict):
        return {}, ["config.json is not an object"]
    return cfg, []


def apply_exceptions(findings, repo, cfg, config_problems):
    """Mark findings covered by a valid, unexpired exception. Returns CI000 findings for invalid or expired ones."""
    extra = [Finding(repo, "config.json", "CI000", "error", p) for p in config_problems]
    valid = []
    for e in cfg.get("exceptions") or []:
        label = "exception %s" % json.dumps(e, sort_keys=True)
        if not isinstance(e, dict) or not all(str(e.get(k, "")).strip() for k in ("rule", "file", "reason", "expires")):
            extra.append(Finding(repo, "config.json", "CI000", "error", "%s needs rule, file, reason and expires" % label))
            continue
        if e["rule"] not in MUST_IDS and e["rule"] not in FIX:
            extra.append(Finding(repo, "config.json", "CI000", "error", "%s names an unknown rule" % label))
            continue
        try:
            exp = datetime.date.fromisoformat(str(e["expires"]))
        except ValueError:
            extra.append(Finding(repo, "config.json", "CI000", "error", "%s has a bad date (use YYYY-MM-DD)" % label))
            continue
        if exp < today():
            extra.append(Finding(repo, str(e["file"]), "CI000", "error",
                                 "exception for %s in %s expired on %s: the violation applies again; fix it or renew the "
                                 "exception with a reason" % (e["rule"], e["file"], e["expires"])))
            continue
        valid.append(e)
    for f in findings:
        for e in valid:
            if e["rule"] == f.rule and e["file"] in ("*", f.workflow):
                f.excepted = "%s (until %s)" % (e["reason"], e["expires"])
                break
    return extra


def detect_repo(root):
    env = os.environ.get("GITHUB_REPOSITORY")
    return env.split("/")[-1] if env else os.path.basename(os.path.abspath(root))


def lint_repo(root, cfg, repo=None, config_problems=(), changed=None):
    """changed: None lints everything as blocking; otherwise a set of repo-relative paths this change touched."""
    repo = repo or detect_repo(root)
    wf_dir = os.path.join(root, ".github", "workflows")
    findings, n = [], 0
    if os.path.isdir(wf_dir):
        for fn in sorted(os.listdir(wf_dir)):
            if fn.endswith((".yml", ".yaml")):
                n += 1
                with open(os.path.join(wf_dir, fn), encoding="utf-8") as fh:
                    findings.extend(lint_workflow(repo, fn, fh.read(), cfg))
    findings.extend(apply_exceptions(findings, repo, cfg, list(config_problems)))
    if changed is not None:
        touched_cfg = any(p.startswith(".github/ci-standard/") for p in changed)
        for f in findings:
            path = ".github/workflows/" + f.workflow
            if f.workflow == "config.json":
                f.existing = not touched_cfg and "cannot be read" not in f.message
            elif path not in changed and not (f.rule == "CI000" and touched_cfg):
                f.existing = True
    return findings, n


# ----------------------------------------------------------------------------- changed files, issues, command line
def _git(root, *args):
    try:
        r = subprocess.run(["git", "-C", root] + list(args), capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.SubprocessError):
        return []
    return [l for l in r.stdout.splitlines() if l.strip()] if r.returncode == 0 else []


def git_changed(root, default_branch):
    files = set(_git(root, "diff", "--name-only", "HEAD")) | set(_git(root, "ls-files", "--others", "--exclude-standard"))
    for base in ("origin/" + default_branch, default_branch):
        mb = _git(root, "merge-base", "HEAD", base)
        if mb:
            files |= set(_git(root, "diff", "--name-only", mb[0], "HEAD"))
            break
    return files


def open_issues(repo_full, findings):
    """One P1 issue per blocking violation, deduplicated by exact title among open issues."""
    made = []
    subprocess.run(["gh", "label", "create", "P1", "-R", repo_full, "--color", "B60205", "--description", "Fix first"],
                   capture_output=True, text=True)
    for f in findings:
        if not f.blocking:
            continue
        title = "[ci-standard] %s in %s" % (f.rule, f.workflow)
        q = subprocess.run(["gh", "issue", "list", "-R", repo_full, "--state", "open", "--limit", "100", "--json", "title",
                            "--jq", ".[].title"], capture_output=True, text=True)
        if title in q.stdout.splitlines():
            continue
        body = ("%s\n\nFix: %s\n\nThis change reached a protected branch without passing the CI/CD standard (an admin merge or a "
                "direct push). Standard: CI-STANDARD.md at the repository root. Local check before pushing: "
                "`python3 .github/ci-standard/ci-cost-lint.py --changed`." % (f.message, FIX.get(f.rule, "")))
        r = subprocess.run(["gh", "issue", "create", "-R", repo_full, "--title", title, "--label", "P1", "--body", body],
                           capture_output=True, text=True)
        made.append(title if r.returncode == 0 else "FAILED: " + title)
    return made


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=".", help="repository checkout (default: current directory)")
    ap.add_argument("--repo", help="repository name (default: GITHUB_REPOSITORY or the folder name)")
    ap.add_argument("--config", default=DEFAULT_CONFIG)
    ap.add_argument("--changed", action="store_true", help="only files changed by this branch block (uses git)")
    ap.add_argument("--changed-list", help="file with the changed paths, one per line (what CI passes)")
    ap.add_argument("--report-only", action="store_true")
    ap.add_argument("--json-out")
    ap.add_argument("--open-issues", metavar="OWNER/REPO")
    args = ap.parse_args(argv)

    cfg, problems = load_config(args.config)
    changed = None
    if args.changed_list:
        with open(args.changed_list, encoding="utf-8") as fh:
            changed = {l.strip() for l in fh if l.strip()}
    elif args.changed:
        changed = git_changed(args.root, cfg.get("default_branch") or "main")
    repo = args.repo or detect_repo(args.root)
    findings, n = lint_repo(args.root, cfg, repo, problems, changed)

    blocking = [f for f in findings if f.blocking]
    excepted = [f for f in findings if f.excepted]
    for f in findings:
        if f.excepted:
            continue
        label = "ERROR" if f.blocking else ("WARNING (existing, not touched by this change)" if f.severity == "error" and f.existing
                                            else "WARNING")
        print("%s %s %s/%s: %s\n    fix: %s" % (label, f.rule, repo, f.workflow, f.message, FIX.get(f.rule, "")))
    for f in excepted:
        print("EXCEPTED %s %s/%s: %s" % (f.rule, repo, f.workflow, f.excepted))
    warn = len([f for f in findings if not f.blocking and not f.excepted])
    print("ci-cost-lint %s: %d workflows, %d blocking, %d warnings, %d excepted%s" %
          (repo, n, len(blocking), warn, len(excepted),
           "" if changed is None else ", %d changed paths checked" % len(changed)))
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as fh:
            json.dump({"repo": repo, "workflows": n, "blocking": len(blocking), "findings": [f.as_dict() for f in findings]}, fh, indent=1)
    if args.open_issues and blocking:
        for t in open_issues(args.open_issues, findings):
            print("issue: " + t)
    return 0 if (args.report_only or not blocking) else 1


if __name__ == "__main__":
    sys.exit(main())
