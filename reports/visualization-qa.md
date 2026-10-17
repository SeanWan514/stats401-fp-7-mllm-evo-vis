# Visualization revision QA — 2026-10-17

Scope: revise the existing final explorer, with primary implementation work on ecosystem growth, two-model radar, and task–model matrix. Preserve the prepared research data and the existing interactive task/evolution views. These are local software and visual checks, not user-study results or deployment evidence.

## Implemented

- Growth: stepped monthly accumulation, separate repository-creation/verified-release modes, family isolation, repository-type filtering, exact monthly/per-family table and type totals, explicit acquisition cutoff and partial-month hatching. Keyboard month inputs and the pointer brush share the period state.
- Radar: distinct line styles and marker shapes, exact values, coverage/missingness notice, restore/swap, active/total parameters and metadata, source protocol controls, direct routes to model development and task-specific practical evidence.
- Matrix: top-5/top-10/custom-k/all, native task control, evidence-based sorting, eligibility filters, ranked candidates and paging, explicit A/B designation and comparison tray. No popularity-to-suitability inference.
- Integration: a visible task-to-comparison workflow, 50–100-word What–Why–How explanations below all five views, an HTML setup/design guide with inspected course references, dependency-free Node preview, and static-build inclusion of the guide and this report.

## Data reconciliation

Read the full prepared payload and repository JSONL without changing either:

| Check | Result |
| --- | ---: |
| Distinct repository IDs and summed growth aggregate | 18,255 / 18,255 |
| Canonical records satisfying verified release/date/source conditions and release aggregate | 49 / 49 |
| Canonical comparison models / supported tasks | 57 / 8 |
| Reviewed default pair with in-range scores in the specified common source groups | 8 axes for each model |
| Qwen-VL quantization repository subset in source and UI | 5,872 / 5,872 |
| October 2026 single-month source and displayed new/cumulative counts | 2,252 / 2,252 |

The default pair is Qwen2.5-VL-7B-Instruct and Qwen2-VL-7B-Instruct. Their eight published dimensions are available; `source_table_only` leaves evaluation details unspecified, and the HallusionBench average definition remains unknown. This is qualified descriptive evidence, not a reproduced controlled comparison. The acquisition month is partial through October 17.

## Browser checks

Local Edge preview, using the included Node server on port 8770. Desktop viewport: 1432 × 680 CSS pixels. Responsive viewport: 390 × 844; document content width 375px with the browser scrollbar, no page-wide overflow. Wide growth, radar, evolution, and matrix SVGs scroll inside their own containers; textual lists, tables, and controls remain available.

Verified:

1. All five SVG views render from the full prepared payload. Default radar has 16 markers, 8 for each model; five What–Why–How blocks appear.
2. Top-5 renders 40 task cells. Custom k = 17 produces 14 + 3 models on two pages (112 + 24 cells). “All” retains 57 eligible models and paginates; changing task and sort resets to the first page.
3. Selecting OCR updates the task evidence and matrix together. Keyboard Enter opens the gemma-3-4b-it/OCR cell; its panel shows B1, E1, C1 and the OCR mapping rationale.
4. Assigning gemma-3-4b-it to A and idefics2-8b to B updates the tray, selectors, and profiles. Each has six dimensions in shared settings. Development and practical-report controls open the intended selected-model evidence.
5. SmolVLM + llama3 license yields an explicit empty candidate state. Selecting MiniCPM-V-4.7-35B-A3B yields no shared score setting, an incomplete-profile notice, and no invented radar points. Restore and swap preserve the eight-axis reviewed example correctly.
6. Family/type filters reconcile Qwen-VL quantizations to 5,872. Switching to verified release mode disables the repository-type selector and counts the release subset independently.
7. A single October selection displays one row, 2,252 new/cumulative records, a nonzero-width chart, and the partial-period label.
8. A real pointer brush selects May 2023–August 2025, updates the native month controls, and changes linked growth and task denominators. Reset restores the complete period.
9. Mobile controls remain readable and the overall document does not overflow. Screenshot records the comparison controls and explicitly qualified eight-axis profile.

Screenshots from this revision:

- [Growth](../docs/screenshots/selection-growth.jpg)
- [Radar and raw-score table](../docs/screenshots/selection-radar.jpg)
- [Top-5 task matrix](../docs/screenshots/selection-matrix.jpg)
- [Mobile comparison](../docs/screenshots/selection-mobile.jpg)

## Automated checks

- `node --check final.js` and `node --check scripts/serve_preview.js`: passed.
- `python -m unittest discover -s tests -v`: 22 passed.
- `python -X utf8 scripts/test_feedback_processing.py`: 9 passed. On this Windows host, the normal GBK default cannot encode the suite's U+2028 fixture; the sandbox also denied one temporary-file replacement. The final run used UTF-8 mode outside that rename restriction, without changing the processing source or prepared tables.
- `git diff --check`: passed; Git only notes the checkout's configured LF-to-CRLF conversion for HTML.
- Static site build: completed; final source files and internal asset links checked in `dist/`.
- Console inspection: no explorer script errors observed. The browser emitted Zotero extension connection errors from `chrome-extension://` URLs, separate from the explorer.

Remaining submission work outside this implementation: group interpretation and usability evaluation, final report/poster, and publication. No commit, push, or public deployment is performed by this revision.
