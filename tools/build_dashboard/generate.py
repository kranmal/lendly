"""Render e2e-dashboard/index.html from a Playwright report + run metadata.

Usage as a script:
    python3 generate.py meta.json template.html output.html

Usage as a module:
    from generate import render
    html_text = render(meta_dict, report_dir, template_path)

`meta` shape:
{
  "run_id": int, "run_number": int, "branch": str, "trigger": str,
  "run_created_iso": "2026-08-24T18:02:50Z",
  "commit_hash": "aa62a18", "commit_msg": "first line only",
  "artifact_size_bytes": int or null,
  "ci_job_seconds": int,
  "runs": [ {"run_number": int, "conclusion": "success"|"failure", "id": int, "created_at": iso}, ... ]
    (oldest first, however many should show in the history strip),
}
`report_dir` is a directory containing report.json plus one <fileId>.json per spec file,
extracted from a Playwright HTML report's embedded playwrightReportBase64 template.
"""
import json, html, datetime, os

REPO = "kranmal/lendly"


def esc(s):
    return html.escape(s, quote=False)


def fmt_ms(ms):
    if ms >= 1000:
        return f"{ms / 1000:.1f}s"
    return f"{ms}ms"


def check_svg():
    return '<svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def x_svg():
    return '<svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'


def chev_svg():
    return '<svg class="chev-sm" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'


# Cosmetic display names for project slugs (derived from each spec file's
# name, e.g. "cot-dashboard.spec.ts" -> "cot-dashboard") that don't reduce to
# a clean title-case of the slug. Anything not listed here just gets
# title-cased - this map only exists to match the app's own display name
# where title-casing the slug wouldn't, not to gate which projects get a
# page. Empty here since lendly's one project slug already title-cases fine.
PROJECT_LABELS = {}


def project_label(slug):
    return PROJECT_LABELS.get(slug, slug.replace('-', ' ').title())


def build_pages(project_slugs):
    """The set of pages this dashboard can render: "overview" (every
    project's card) plus one page per project slug, each living at
    e2e-dashboard/<slug>/index.html. Computed fresh from whatever spec files
    are actually in the report, so a new project gets a page automatically
    the first time its tests run - nothing to wire up by hand here.
    """
    pages = {'overview': {'label': 'Overview (all projects)', 'path': 'index.html'}}
    for slug in project_slugs:
        pages[slug] = {'label': project_label(slug), 'path': f'{slug}/index.html'}
    return pages


def build_nav(current_page, pages):
    """Renders the page-switcher dropdown (a <details> menu, no JS needed to
    open/close) that lets a reader jump between the all-projects overview and
    a single project's dedicated results page.

    Every non-overview page lives one directory below e2e-dashboard/ (e.g.
    parapet/index.html), so a link's relative href only depends on whether
    *this* page is the overview (links go straight to "<path>") or a
    subpage (links need a "../" prefix, except back to the overview itself).
    """
    items = []
    for key, page in pages.items():
        label = page['label']
        if key == current_page:
            items.append(f'<span class="nav-item active">{esc(label)}</span>')
            continue
        if current_page == 'overview':
            href = page['path']
        elif key == 'overview':
            href = '../index.html'
        else:
            href = '../' + page['path']
        items.append(f'<a class="nav-item" href="{href}">{esc(label)}</a>')
    current_label = pages[current_page]['label']
    return (
        '<details class="nav-select">'
        f'<summary><span>{esc(current_label)}</span>{chev_svg()}</summary>'
        f'<div class="nav-menu">{"".join(items)}</div>'
        '</details>'
    )


def render(meta, report_dir, template_path, project_filter=None, current_page='overview'):
    r = json.load(open(os.path.join(report_dir, 'report.json')))
    all_files = {f['fileId']: json.load(open(os.path.join(report_dir, f"{f['fileId']}.json"))) for f in r['files']}
    all_project_slugs = sorted({d['fileName'].rsplit('.spec.', 1)[0] for d in all_files.values()})
    pages = build_pages(all_project_slugs)
    if project_filter is None:
        files = all_files
    else:
        files = {fid: d for fid, d in all_files.items() if d['fileName'].rsplit('.spec.', 1)[0] in project_filter}

    if project_filter is None:
        # Whole-suite stats come straight from Playwright's own totals.
        total_tests = r['stats']['total']
        total_passed = r['stats']['expected']
        total_failed = r['stats']['unexpected']
        suite_seconds = r['duration'] / 1000
    else:
        # A filtered page's stats only cover the tests actually shown on it.
        subset_tests = [t for d in files.values() for t in d['tests']]
        total_tests = len(subset_tests)
        total_passed = sum(1 for t in subset_tests if t['ok'])
        total_failed = total_tests - total_passed
        suite_seconds = sum(t['duration'] for t in subset_tests) / 1000
    pass_rate = round(100 * total_passed / total_tests) if total_tests else 0

    run_bars = []
    for run in meta['runs']:
        ok = run['conclusion'] == 'success'
        cls = 'pass' if ok else 'fail'
        dt = datetime.datetime.strptime(run['created_at'], '%Y-%m-%dT%H:%M:%SZ')
        label = f"Run #{run['run_number']} — {'passed' if ok else 'failed'} — {dt.strftime('%b %d, %H:%M')} UTC"
        url = f"https://github.com/{REPO}/actions/runs/{run['id']}"
        run_bars.append(f'<a class="run-bar {cls}" href="{url}" target="_blank" rel="noopener" title="{esc(label)}"></a>')
    runs_html = '\n      '.join(run_bars)
    n_runs_shown = len(meta['runs'])

    cards = []
    for fid, d in files.items():
        fname = d['fileName']
        proj_name = fname.rsplit('.spec.', 1)[0]
        tests = d['tests']
        n_passed = sum(1 for t in tests if t['ok'])
        n_total = len(tests)
        all_ok = n_passed == n_total

        test_rows = []
        for t in tests:
            res = t['results'][0]
            ok = t['ok']
            dot_cls = 'pass' if ok else 'fail'
            steps = [s for s in res['steps'] if s['title'] not in ('Before Hooks', 'After Hooks')]
            step_rows = []
            for s in steps:
                step_rows.append(
                    f'<div class="nstep"><div class="nstep-rail"><div class="nstep-dot"></div><div class="nstep-line"></div></div>'
                    f'<div class="nstep-body"><span class="nstep-name">{esc(s["title"])}</span>'
                    f'<span class="nstep-dur mono tab-nums">{fmt_ms(s["duration"])}</span></div></div>'
                )
            if step_rows:
                step_rows[-1] = step_rows[-1].replace('<div class="nstep-line"></div>', '')
            steps_html = '\n          '.join(step_rows)
            test_rows.append(f'''        <details class="test">
          <summary class="test-summary">
            <span class="test-dot {dot_cls}"></span>
            <span class="test-name">{esc(t['title'])}</span>
            <span class="test-dur mono tab-nums">{fmt_ms(t['duration'])}</span>
            <svg class="chev" viewBox="0 0 16 16" width="12" height="12"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </summary>
          <div class="test-steps">
          {steps_html}
          </div>
        </details>''')
        tests_html = '\n'.join(test_rows)

        pill_cls = 'pass' if all_ok else 'fail'
        pill_svg = check_svg() if all_ok else x_svg()
        pill_text = 'PASSED' if all_ok else 'FAILED'

        label = project_label(proj_name)
        # On the overview, a project's own page is one click away; on that
        # project's own (single-card) page a self-link would be a no-op.
        name_html = (
            f'<a class="proj-name" href="{proj_name}/index.html">{esc(label)}</a>'
            if current_page == 'overview' else
            f'<div class="proj-name">{esc(label)}</div>'
        )

        cards.append(f'''    <div class="card">
      <div class="card-head">
        <div class="card-head-top">
          {name_html}
          <div class="pill {pill_cls}">{pill_svg}{pill_text}</div>
        </div>
        <div class="card-tags">
          <span class="tag mono">chromium</span>
          <span class="tag mono">{n_passed}/{n_total} tests</span>
        </div>
      </div>
      <div class="test-list">
{tests_html}
      </div>
    </div>''')

    cards_html = '\n\n'.join(cards)

    status_ok = total_failed == 0
    badge_cls = 'pass' if status_ok else 'fail'
    badge_svg = check_svg() if status_ok else x_svg()
    badge_text = 'ALL PASSING' if status_ok else f'{total_failed} FAILING'

    run_dt = datetime.datetime.strptime(meta['run_created_iso'], '%Y-%m-%dT%H:%M:%SZ')
    run_created_fmt = run_dt.strftime('%b %d, %Y') + ' · ' + run_dt.strftime('%H:%M') + ' UTC'

    if current_page == 'overview':
        page_title = 'E2E Test Results'
        h1 = 'E2E Test Results'
        eyebrow_scope = 'e2e-tests'
        section_label = 'Projects'
        meta_desc = ('Playwright end-to-end test results for every project in this repo, '
                     'run automatically on every push via GitHub Actions.')
    else:
        proj_label = pages[current_page]['label']
        page_title = f'E2E Test Results — {proj_label}'
        h1 = f'{proj_label} — E2E Test Results'
        eyebrow_scope = f'e2e-tests · {current_page}'
        section_label = proj_label
        meta_desc = (f'Playwright end-to-end test results for the {proj_label} project, '
                     'run automatically on every push via GitHub Actions.')

    out = open(template_path, encoding='utf-8').read()
    out = out.replace('__PAGE_TITLE__', esc(page_title))
    out = out.replace('__H1__', esc(h1))
    out = out.replace('__EYEBROW_SCOPE__', esc(eyebrow_scope))
    out = out.replace('__SECTION_LABEL__', esc(section_label))
    out = out.replace('__META_DESC__', esc(meta_desc))
    out = out.replace('__NAV_HTML__', build_nav(current_page, pages))
    out = out.replace('__BADGE_CLS__', badge_cls)
    out = out.replace('__BADGE_SVG__', badge_svg)
    out = out.replace('__BADGE_TEXT__', badge_text)
    out = out.replace('__RUN_NUMBER__', str(meta['run_number']))
    out = out.replace('__BRANCH__', esc(meta['branch']))
    out = out.replace('__TRIGGER__', esc(meta['trigger']))
    out = out.replace('__RUN_CREATED__', run_created_fmt)
    out = out.replace('__RUN_URL__', f"https://github.com/{REPO}/actions/runs/{meta['run_id']}")
    out = out.replace('__RUNS_HTML__', runs_html)
    out = out.replace('__RUNS_COUNT__', str(n_runs_shown))
    out = out.replace('__PASS_RATE__', f'{pass_rate}%')
    out = out.replace('__TOTAL_TESTS__', str(total_tests))
    out = out.replace('__TOTAL_PASSED__', str(total_passed))
    out = out.replace('__TOTAL_FAILED__', str(total_failed))
    out = out.replace('__FAILED_STAT_CLS__', 'stat fail' if total_failed else 'stat')
    out = out.replace('__SUITE_TIME__', f'{suite_seconds:.1f}s')
    out = out.replace('__CI_JOB_TIME__', f"{meta['ci_job_seconds']}s")
    out = out.replace('__CARDS_HTML__', cards_html)
    out = out.replace('__COMMIT_HASH__', esc(meta['commit_hash']))
    out = out.replace('__COMMIT_MSG__', esc(meta['commit_msg']))
    if meta.get('artifact_size_bytes'):
        mb = meta['artifact_size_bytes'] / (1024 * 1024)
        out = out.replace('__ARTIFACT_SIZE__', f'{mb:.1f}&nbsp;MB')
    else:
        out = out.replace('__ARTIFACT_SIZE__', 'n/a')
    return out


if __name__ == '__main__':
    import sys
    meta_path, template_path, output_path = sys.argv[1], sys.argv[2], sys.argv[3]
    meta = json.load(open(meta_path))
    html_text = render(meta, meta['report_dir'], template_path)
    open(output_path, 'w', encoding='utf-8').write(html_text)
    print(f'wrote {len(html_text)} bytes to {output_path}')
