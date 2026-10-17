# Visualization revision QA — 2026-10-17

The latest [visualization 2 follow-up](#visualization-2-follow-up) revises the task explorer. It passes 37 checks, keeps the prepared data unchanged, and has desktop/mobile browser verification. The initial views 1/4/5 revision below is retained as the earlier QA record.

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

## Visualization 2 follow-up

Revised the user task explorer to match current availability: eight supported task definitions, five with benchmark mappings, and 1,965 of 21,674 full-snapshot feedback records carrying at least one supported task label. The implementation uses the prepared payload without fetching new data or relabeling source records.

### Design and behavior

- Responsive D3 phrase buttons retain count-scaled text, exact counts, and explicit mapped/unmapped badges. A coordinated ranked list uses custom SVG bars with a zero baseline. Native buttons provide keyboard selection and readable mobile text.
- Count switching separates all task-tagged records from rule-inferred experience reports. Mapping filters and count/name ordering affect this task view only; shared family, month, and platform filters determine both numerator and denominator.
- The denominator counts all eligible feedback from `feedback_totals`. Task totals use only `scope=all` buckets; repeated model/family buckets never inflate them. Overlapping tasks are not summed into a distinct-record denominator.
- The evidence panel shows definitions, counts, benchmark rationale and definition links, inclusion-rule phrases, and an explicit route to the selected matrix task. Unmapped tasks remain selectable and state their quantitative evidence gap.
- Source cards deduplicate retained IDs and paginate four excerpts at a time. Experience mode restricts the source sample to the matching recorded experience types. Aggregate totals, sample size, provisional attribution, and truncation are labeled separately; sample absence does not erase a nonzero aggregate.
- An empty family/window retains zero-count definitions and shows an unavailable percentage, rather than dividing by zero. Local coverage filtering retains the shared selected task with an explicit hidden-selection note.

### Verified data and browser states

| Document-understanding scope | Eligible feedback | Task-tagged records | Experience subset | Retained excerpts |
| --- | ---: | ---: | ---: | ---: |
| All platforms | 21,674 | 346 | 100 | 16 |
| GitHub | 19,547 | 315 | 91 | 8 |
| Hugging Face | 2,127 | 31 | 9 | 8 |

Browser checks confirmed the default full-window counts and GitHub subset; all three rows were reconciled directly against the prepared payload. The excerpt sample is capped by the builder and is not representative of these aggregate populations.

Verified keyboard Enter on OCR retains focus on its phrase button, selects `ocr` in the matrix, and opens the matching evidence. Experience switching shows 37 OCR reports with only one retained matching excerpt, keeping that gap visible. Unmapped filtering displays three definitions while retaining a hidden mapped selection explicitly; selecting Image description updates the matrix and shows the missing benchmark mapping. Source paging advances from 1–4 to 5–8 of 16 and resets on platform/task changes. The model-candidate route and matrix task selector coordinate in both directions. Name ordering starts with Chart and table understanding. A BLIP family filter has no eligible feedback: all eight definitions remain at zero, the percentage is unavailable, and the sample is empty.

At 390 × 844, document content width remains 375px with the browser scrollbar and no horizontal overflow. The eight phrase labels render at approximately 19–26px in the default state. Desktop layout was inspected at 1432 × 680 with full-section screenshots. Console checking distinguishes browser-extension messages from explorer script errors.

Screenshots: [task overview](../docs/screenshots/selection-tasks.jpg), [definition and source evidence](../docs/screenshots/selection-task-evidence.jpg), [mobile task controls and phrases](../docs/screenshots/selection-tasks-mobile.jpg).

### Checks

- Six new Node tests pass: repeated attribution scopes, filtered denominators, multi-label overlap, count switching and mapping gaps, sample deduplication/experience selection, and the full prepared snapshot.
- The existing 22 Python regression checks and 9 feedback checks pass. UTF-8 mode and the previously documented Windows sandbox workaround were used for the feedback suite.
- JavaScript syntax and whitespace checks pass. `task-evidence.js` is included in the static-site allowlist; `make test` runs its tests and `make syntax` checks it. No new package dependencies are required.
- The What–Why–How paragraph below view 2 is 94 words. The guide, view contract, README, and build instructions describe the revised behavior.

No sentiment distribution or model suitability is inferred from mention volume. Label accuracy, usability evaluation, and public deployment remain separate from these implementation checks.
