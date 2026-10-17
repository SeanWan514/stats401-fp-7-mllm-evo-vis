# Data handoff explorer: view contract

This is an independent integration preview at `final.html`. It demonstrates that Shilin's prepared tables can support the five agreed views. It does not replace the original interim site, claim completion of the visualization teammate's assignment, or substitute for the group's user evaluation.

## Run and rebuild

From the repository root:

```sh
python3 scripts/build_final_views.py
python3 -m http.server 8767 --bind 127.0.0.1
```

Open `http://127.0.0.1:8767/final.html`. Serve over HTTP; browsers commonly block JSON fetches from `file://`. D3 7.9.0 is pinned to the jsDelivr CDN. If D3 or the prepared JSON cannot load, the page displays an explicit error instead of example data.

`build_final_views.py` reads `data/final/repositories.jsonl`, `models.json`, `benchmark_results.csv` (or `.csv.gz`), `model_relationships.csv`, `feedback.jsonl`, and `tasks.json`. The optional `reports/model_radar_coverage.json` supplies the reviewed default pair and each axis's source protocol group. It writes `data/final/view_data.json`; missing source files are recorded in `missing_inputs` and the page displays a partial-handoff notice.

The browser requests only `view_data.json`, containing monthly ecosystem counts, canonical metadata, eight dimension specifications, qualified primary scores, sourced relationships, sparse feedback aggregates, and a limited excerpt lookup. It never downloads the complete feedback JSONL or the 140,000-plus-row benchmark table. The full source tables remain the authority.

## What / Why / How

| View | What | Why | How and linked action |
| --- | --- | --- | --- |
| Ecosystem growth | Cumulative repositories created **within** selected months, or verified canonical releases in a separate mode | Distinguish ecosystem activity and derivatives from original model releases | D3 stacked area, stable family colors, family/type filters, exact totals, monthly brush; brushing updates the shared time window |
| User task explorer | Task phrases and a ranked list sized by distinct eligible feedback records | Make task demand visible without interpreting generic word frequency as suitability | D3 SVG phrase layout, deterministic placement, platform/time/family filtering; clicking a phrase selects the same task in the matrix and reveals definition, denominator, mapping rationale, and source excerpts |
| Family evolution | Canonical models at their recorded release dates in family lanes | Inspect chronology and recorded relationships without inventing ancestry | D3 SVG nodes, curved links, sourced type filter, optional label expansion; click or keyboard-select a node to inspect metadata, relationships, sources, and comparison actions |
| Two-model radar | Eight separate benchmark axes and a raw-score table | Expose complementary strengths and missing evidence without making an aggregate ranking | Two selectors, fixed scale normalization, explicit per-axis source protocol selection, source links; absent dimensions break adjacent line segments instead of becoming zero |
| Task–model matrix | Separate benchmark coverage B, rule-inferred experience E, and exact-model eligible feedback C | Shortlist on evidence and reveal gaps, without equating volume with quality | Custom SVG, selected task highlighting, family/license/parameter/openness filters, coverage/experience/name/parameter sorting, 14-model pagination, cell drill-down, send-to-A/B controls |

## Shared identifiers and state

- `models[].id` is the canonical key. `repo_ids` are exact aliases used for input resolution; unresolved names are never fuzzy-matched into a canonical model.
- `tasks[].id` joins labels, phrase selection, benchmark mappings, feedback aggregates, and matrix columns.
- Family colors are derived once from a stable sorted family domain and reused across views.
- Shared state includes family, complete calendar-month interval, feedback platform, selected task, focused model, and radar model A/B. The initial task is the most frequent supported task with a benchmark mapping and observed feedback; the ranked list still shows all supported tasks by count.
- Platform selection affects feedback only. The time window affects repository activity, release nodes, and feedback. Benchmarks explicitly use the full prepared snapshot, and radar choices remain explicit instead of changing when a family filter changes.
- The growth brush has a keyboard-accessible equivalent in the two month inputs. SVG task/node/cell controls support Enter and Space. Matrix and evolution graphics scroll horizontally on narrow screens; metadata controls, the ranked list, and the raw-score table provide textual access.

## Counting and missingness

1. Repository counts deduplicate exact `repo_id`/`id`. Creation date is never substituted for release date. Unknown dates are excluded from time axes and counted separately. `original_release`, `fine_tune`, `adapter`, `quantization`, and `unknown` remain separate repository types.
2. Verified-release mode requires a verified release status, a valid date, and `release_evidence_url`. Unknown dates do not become January 1 or the repository creation date.
3. Every distinct eligible feedback `id` counts once in the denominator and at most once per task. Multi-label task counts are not additive. Feedback with no task label remains in the denominator.
4. Exact-model buckets require resolved canonical model IDs and model-level attribution. Family-attributed feedback has separate buckets; it never appears in individual model E/C cells. Exact repositories outside the canonical comparison set remain in the task denominator; they are not relabeled as family-only evidence.
5. E means rule-inferred `usage_observation` or `problem_report` (plus equivalent explicit experience categories when supplied). E is a subset of C. Rules are fallible; neither E nor C denotes verified use or independent users. Repository attribution does not prove the exact variant was tested. Source author roles, including unknown roles, are retained in excerpts. Completed human-validation counts are reported separately.
6. A matrix cell's B is the **number of mapped dimensions with at least one unambiguous qualified score**, not a performance score. Empty mapping means no verified mapping, not evidence that the task is impossible. A cell can have feedback with no benchmark evidence or vice versa.
7. Excerpts are a convenience sample, not a statistical sample: at most 500 distinct records, 280 characters per excerpt, one excerpt per bucket, and eight per task/scope/entity/platform. Email, phone, and common credential patterns are redacted. The UI shows at most four excerpts per panel. Their absence in a narrow filter window does not erase an aggregate count. Source URLs remain available.
8. Machine labels retain `pending_human_review`; the UI never labels them human validated. Empty filters show empty states rather than fallback records.

## Benchmark safeguards

Only rows with `visualization_eligible=true` and `is_primary_metric=true` are used when those fields exist. Nonempty `canonical_model_id` is required for the current long table. Score grouping includes canonical model, dimension, and `comparability_group`. Conflicting score/metric/unit/split/setting records in the same group become ambiguous and unavailable; the builder never chooses the maximum or averages conflicting values.

Normalization uses the dimension's fixed range: 0–100 for the seven percentage dimensions and 0–1,000 points for OCRBench v1. `higher_is_better=false` reverses the normalized direction if a future verified dimension requires it. Out-of-range or missing results are not drawn. Source-specified variants, splits, and metrics remain visible in the table. MMBench language/version groups and HallusionBench aggregate definitions are not silently merged.

The reviewed default pair uses the explicit per-dimension source protocol group from the coverage report. Other pairs prefer a shared official source-table group. If no shared group exists, the axis remains unavailable; a user may deliberately select a partial group to inspect one model. A common group marked `source_table_only` or `unknown_settings` does **not** establish a fully controlled comparison. The page says so and exposes the status and sources. The radar shape is descriptive; it never computes an overall model ranking.

## Deterministic output

`generated_at` is the latest source `retrieved_at` or `collected_at` in UTC, not the wall-clock time of the build. Input SHA-256 hashes are recorded over logical uncompressed content, so a `.csv` or its identical `.csv.gz` yields the same hash. Repeated runs over identical inputs produce byte-identical JSON. Compressed long-table inputs are supported.

## Verification and remaining scope

Before handoff, rebuild from the finished tables, compare displayed totals with the data quality reports, and verify this path in the browser: select task → inspect matrix evidence → shortlist two models → compare profiles → inspect family history and practical reports. Test a model with no benchmark scores and a filter combination with no candidates. Check mobile layout and the console for rendering errors.

Screenshots are integration evidence of the prepared snapshot, not user-study results. The delivery still requires the group's human labeling, agreement/error analysis, and task-based usability evaluation. A functioning view cannot turn an unmet collection target or unknown evaluation protocol into a completed requirement.

### Browser QA completed on 2026-10-17

The local HTTP-served page was exercised in the Codex browser at 1280px desktop width and a 390 × 844 mobile viewport. All five SVG views rendered. The mobile document width remained 390px; wide matrix and timeline content stayed inside their scroll containers. No browser console errors were observed.

Verified interactions: family filtering, repository/release mode switching, a real pointer drag on the monthly brush followed by reset, task-to-matrix linking, experience sorting, matrix evidence drill-down, matrix-to-radar model selection, protocol selection, a model with no shared scores, an empty family/license candidate combination, and platform-specific feedback denominators. Community evidence and benchmark coverage remained separate throughout.

Regression checks run with:

```sh
python3 -m unittest discover -s tests -v
node --check final.js
```

The regression fixtures check deduplication, task denominators, family/model separation, unresolved repository attribution, rule-inferred experience bounds, conflicting score missingness, compressed CSV inputs, contact/token excerpt redaction, Unicode U+2028, missing input notices, and byte-identical rebuilds. These are software/data-contract checks; they are not human label-validation or usability-study results.

Integration screenshots are saved in `docs/screenshots/`. `final-radar-overview.jpg` shows the radar, metadata, and its evidence caveat. `final-mobile-tasks.jpg` records the narrow-screen check. The five final view screenshots and a whole-page snapshot record the final prepared data handoff.

### Frozen screenshot snapshot

The final screenshots use **18,255 repositories, 57 canonical models, 143,086 benchmark measurements, and 21,674 cleaned community feedback records**. Of these feedback records, 1,965 have a supported task label and 1,507 resolve to a canonical model. Human-validation completion remains zero. There are eight supported task definitions; the suggested 10–20 category target remains unmet.

- [Ecosystem growth](screenshots/final-growth.jpg)
- [Task phrases and ranking](screenshots/final-tasks.jpg)
- [Family evolution, Qwen-VL filter](screenshots/final-evolution.jpg)
- [Two-model radar overview](screenshots/final-radar-overview.jpg)
- [Task–model matrix](screenshots/final-matrix.jpg)
- [Whole-page snapshot](screenshots/final-full-page.jpg)
- [Mobile task view](screenshots/final-mobile-tasks.jpg)

The final frozen dataset was rechecked through task keyboard selection, model-matrix drill-down, send-to-radar, a no-shared-score model, an empty candidate filter, and the 390px responsive layout. The selected official-table pair displays all eight axes; the displayed comparison caveat remains in place. Browser error logs were empty.
