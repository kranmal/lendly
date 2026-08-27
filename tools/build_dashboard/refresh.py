"""Fetch the latest E2E Tests workflow run and rebuild the e2e-dashboard pages:
e2e-dashboard/index.html (every project's card) plus one
e2e-dashboard/<project>/index.html per spec file actually present in the
report - all from the same Playwright report, and discovered fresh each run
rather than hardcoded, so a newly-tested project gets its own page
automatically.

Usage:
    python3 tools/build_dashboard/refresh.py

Requires the `gh` CLI, authenticated with access to this repo (needs Actions
read access to fetch run/job/artifact metadata and download the
playwright-report artifact).

By default, "latest run" means the most recent run with overall status
"completed". When called from a job *within the same workflow run* (e.g. a
follow-up job with `needs: e2e`), that run isn't "completed" yet - the
in-progress job you're calling from is still part of it - so auto-detection
would silently pick the *previous* run instead. Set these env vars to target
the current run explicitly in that case:
    E2E_RUN_ID          - github.run_id of the current run
    E2E_RUN_CONCLUSION   - result of the job whose report you want, e.g.
                           ${{ needs.e2e.result }} ("success"/"failure"/...);
                           only used for the history-strip color, since the
                           run's own `conclusion` field is null until the
                           whole run (including the caller's own job) ends

Prints one of:
    CHANGED    - one or both dashboard pages were rewritten, caller should commit
    UNCHANGED  - latest run's data matches what's already on disk, nothing to do
and exits non-zero with a message on stderr if a completed run or its
playwright-report artifact can't be found (e.g. no runs yet, or the run's
artifact already expired) - callers should not commit anything in that case.
"""
import json, subprocess, sys, os, re, base64, zipfile, io, tempfile, shutil, datetime

REPO = "kranmal/lendly"
WORKFLOW = "e2e.yml"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = subprocess.check_output(
    ["git", "-C", SCRIPT_DIR, "rev-parse", "--show-toplevel"], text=True
).strip()


def gh_json(path):
    out = subprocess.check_output(["gh", "api", path])
    return json.loads(out)


def gh_bytes(path):
    return subprocess.check_output(["gh", "api", path])


def fail(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)


def main():
    override_run_id = os.environ.get("E2E_RUN_ID")
    runs = gh_json(f"repos/{REPO}/actions/workflows/{WORKFLOW}/runs?per_page=30")["workflow_runs"]
    completed = sorted(
        [r for r in runs if r["status"] == "completed"], key=lambda r: r["run_number"]
    )

    if override_run_id:
        run_id = int(override_run_id)
        latest = gh_json(f"repos/{REPO}/actions/runs/{run_id}")
        latest_conclusion = os.environ.get("E2E_RUN_CONCLUSION") or latest.get("conclusion") or "success"
        # completed[] won't include this run yet (it's still in progress - this
        # job is part of it), so append it explicitly for the history strip.
        history = [r for r in completed if r["id"] != run_id][-7:] + [
            {
                "run_number": latest["run_number"],
                "conclusion": latest_conclusion,
                "id": run_id,
                "created_at": latest["created_at"],
            }
        ]
    else:
        if not completed:
            fail("No completed workflow runs found for e2e.yml")
        latest = completed[-1]
        run_id = latest["id"]
        latest_conclusion = latest["conclusion"]
        history = completed[-8:]

    # Every entry (whether a raw API run object or the manually-built current-run
    # dict above) already has these four keys, so this projection works for both.
    history_meta = [
        {
            "run_number": r["run_number"],
            "conclusion": r["conclusion"],
            "id": r["id"],
            "created_at": r["created_at"],
        }
        for r in history
    ]

    jobs = gh_json(f"repos/{REPO}/actions/runs/{run_id}/jobs")["jobs"]
    if not jobs:
        fail(f"Run {run_id} has no jobs")
    job = next((j for j in jobs if j["name"] == "e2e"), jobs[0])
    started = datetime.datetime.strptime(job["started_at"], "%Y-%m-%dT%H:%M:%SZ")
    completed_at = datetime.datetime.strptime(job["completed_at"], "%Y-%m-%dT%H:%M:%SZ")
    ci_job_seconds = round((completed_at - started).total_seconds())

    sha = latest["head_sha"]
    commit = gh_json(f"repos/{REPO}/commits/{sha}")
    commit_msg = commit["commit"]["message"].split("\n")[0]

    artifacts = gh_json(f"repos/{REPO}/actions/runs/{run_id}/artifacts")["artifacts"]
    pw = next((a for a in artifacts if a["name"] == "playwright-report"), None)
    if pw is None:
        fail(f"Run {run_id} has no playwright-report artifact (may have expired)")

    zip_bytes = gh_bytes(f"repos/{REPO}/actions/artifacts/{pw['id']}/zip")

    work = tempfile.mkdtemp(prefix="e2e-dashboard-")
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            zf.extractall(work)

        index_path = os.path.join(work, "index.html")
        content = open(index_path, encoding="utf-8").read()
        m = re.search(
            r'<template id="playwrightReportBase64">data:application/zip;base64,([^<]*)</template>',
            content,
        )
        if not m:
            fail("Could not find embedded report data in playwright-report/index.html")

        report_data = base64.b64decode(m.group(1))
        report_dir = os.path.join(work, "report_data")
        os.makedirs(report_dir, exist_ok=True)
        with zipfile.ZipFile(io.BytesIO(report_data)) as zf:
            zf.extractall(report_dir)

        meta = {
            "run_id": run_id,
            "run_number": latest["run_number"],
            "branch": latest["head_branch"],
            "trigger": latest["event"],
            "run_created_iso": latest["created_at"],
            "commit_hash": sha[:7],
            "commit_msg": commit_msg,
            "artifact_size_bytes": pw.get("size_in_bytes"),
            "ci_job_seconds": ci_job_seconds,
            "runs": history_meta,
        }

        sys.path.insert(0, SCRIPT_DIR)
        from generate import render

        template_path = os.path.join(SCRIPT_DIR, "template.html")
        dashboard_dir = os.path.join(REPO_ROOT, "e2e-dashboard")

        # One project slug per spec file actually in this report - read
        # straight from report.json rather than any hardcoded list, so a
        # newly-tested project gets its own page the next time this runs,
        # with nothing to update here by hand.
        report_json = json.load(open(os.path.join(report_dir, "report.json")))
        project_slugs = sorted({f["fileName"].rsplit(".spec.", 1)[0] for f in report_json["files"]})

        # The overview page keeps every project's card; each other page is
        # that one project's results, filtered from the same report, linked
        # via the nav dropdown every page renders (see generate.build_pages).
        outputs = [(os.path.join(dashboard_dir, "index.html"), None, "overview")]
        for slug in project_slugs:
            outputs.append(
                (os.path.join(dashboard_dir, slug, "index.html"), {slug}, slug)
            )

        any_changed = False
        for out_path, project_filter, current_page in outputs:
            new_html = render(meta, report_dir, template_path, project_filter=project_filter, current_page=current_page)
            old_html = open(out_path, encoding="utf-8").read() if os.path.exists(out_path) else None
            if new_html == old_html:
                continue
            any_changed = True
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(new_html)

        print("CHANGED" if any_changed else "UNCHANGED")
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
