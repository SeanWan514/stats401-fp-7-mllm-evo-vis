# Repository organization and recovery

## Scope — 19 October 2026

This release organizes the existing project for grading. It does not alter the five visualization algorithms, collected records, benchmark values or feedback labels.

- Current modules/styles move to `assets/js/` and `assets/css/`.
- Sixteen earlier website files move unchanged to `archive/website/`.
- Earlier report drafts move to `archive/report-drafts/`; `REPORT.md` retains a link to the final PDF for existing bookmarks.
- Supplied report and poster PDFs are published under `deliverables/`, without content edits.
- The README starts with a nine-deliverable Grader's View; indexes distinguish current entry points from history.
- The build preserves historical website URLs and excludes raw caches/full feedback from Pages. Local preview serves the built bundle.

## Recovery

Annotated tag **`pre-repo-cleanup-2026-10-19`** preserves the complete tracked tree at **`22ce95a617c97f491c0a08c958898e12a8f75f81`**. Earlier recovery tags remain untouched.

Inspect the previous version without overwriting current work:

```bash
git worktree add --detach ../mllm-before-cleanup pre-repo-cleanup-2026-10-19
```

Do not reset or delete the active checkout to recover files. Revert the organization commit only after checking later changes and coordinating with the group. Untracked `scripts/build_report_pdf.py`, `tmp/` and local output files were not edited or committed by this cleanup.

## Verification

Run `make check` and `make site`. Organization tests verify grader links, archived hashes, active paths, PDF checksums and the deployment allowlist. `scripts/verify_deployed_site.py` compares live bytes with the built release; this is not a new user study. Existing reports remain dated evidence of their respective releases.

Local acceptance completed on 19 October 2026:

- 70 regression tests passed: 27 Python discovery tests, 9 feedback tests and 34 Node tests; JavaScript syntax checks also passed.
- The allowlisted website builds successfully with 105 public files. Raw archives and full feedback are excluded.
- All 23 relocated website files match the recovery tag byte-for-byte; both PDFs match the supplied originals.
- Chromium checks passed at 1440 × 1000 and 390 × 844: five chart views, task selection, dialogs/Escape, radar model change and family-stage switching.
- Both PDF routes and all four historical website pages load in the built preview. No page exceptions or failed same-origin requests were recorded.

Deployment confirmation is recorded separately in [production_release_check.json](../reports/production_release_check.json), with its checked source commit. Local checks alone do not establish publication.
