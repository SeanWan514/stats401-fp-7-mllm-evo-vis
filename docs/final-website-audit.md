# Website audit · modal and task-selection refinement

18 October 2026. Scope: website, prepared data and code. Report, poster, presentation and Canvas submission remain separate deliverables.

## Release status

**Technical website release: GO.** This modal-focused revision passed local checks, GitHub validation, Pages deployment and published-file verification. The [previous audit](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/bfe6314ea937c1bd37c42ce6eb77b31cb7a954de/docs/final-website-audit.md) preserves historical release decisions and tests. This is not a new human usability approval or a certification of the separate final-submission package.

## Requested changes

1. **Growth:** requested introduction; January 2023 repository display start; smooth cumulative filled areas; hover/tap/keyboard month inspection instead of brushing. Removed the quantization takeaway and next arrow. Guide/count/date details are a popup. Fifteen earlier records remain in the baseline: January 2023 is 18; the final total stays 18,255.
2. **User interests:** requested introduction, full-width phrase cloud, no next link or redundant filter explanation. A phrase opens evidence in a popup. The guide prominently states **21,674 distinct retained posts/comments**, acquisition stages, exact counts, source filtering and label limits.
3. **Families:** requested introduction; no A/B controls. Search and model tracing remain; selection opens sources. A guide explains **18,255 repositories → 57 canonical models**. Release, family and performance stages retain the same identities; benchmark/source controls appear only in Performance.
4. **Radar:** requested introduction; standalone A/B selectors remain. Dimensions/coverage and raw-score/source information open in popups. The next link is removed. Pairs require at least four shared measured dimensions; missing data never becomes zero.
5. **Task selection:** requested introduction. The overlapping scatterplot is replaced by four explicit size tiers with ranked model rows, exact scores and common scales. Five tasks with comparative evidence appear in the selector; all eight categories remain in the data. The top three measured models per tier appear; the complete candidate list and gaps remain accessible by popup. No A/B buttons, numbered workflow or shortlist/export bar remain.
6. **Focus:** removed the global exploration bar. Supporting guides and evidence panels for all five charts use centered native dialogs with a dimmed backdrop, Escape/×/outside-click dismissal, keyboard focus containment and focus restoration.

The [detailed checklist](modal-refinement-checklist.md) records data scopes and safeguards. Slide-by-slide navigation is intentionally deferred to the requested next revision.

## Verification of this revision

- **57 regression tests pass:** 22 Python unit tests, 9 feedback-processing tests and 26 JavaScript tests. JavaScript syntax, data validation, static build and Git whitespace checks pass.
- Actual built website tested at desktop 1280 × 720 and mobile 390 × 844. No recorded browser errors/warnings in the checked session; no horizontal page overflow at the mobile size.
- All seven guide buttons open their intended dialogs. Dynamic concern/model/candidate dialogs open. Escape, × and outside click close correctly. Keyboard focus containment/restoration were checked; a cloud-redraw focus loss was found and fixed before release.
- Timeline: January 2023–October 2026. Home/End inspect 18 and 18,255 cumulative repositories; arrows move one month. Verified-release mode shows 49 dated models. Count regressions reconcile source records.
- Every supported task renders measured rankings: 41 known-size models for MMBench, OCRBench and the default reasoning source; five for the selected DocVQA and ChartQA sources. No row bounding-box overlaps occurred in checked desktop/mobile layouts.
- Impossible size/license filters show an explicit empty state and working Reset filters button. The complete candidate popup has all 57 default eligible models, including missing-score cases; sorting works. Candidate sources open without affecting the radar.
- Word-cloud task evidence navigates to the matching task selection and closes its popup. Unsupported interests remain inspectable without invented performance recommendations.
- Family search highlights models without hiding context. Performance exposes benchmark/source controls and updates measured counts. Model selection opens metadata and sources without A/B controls.
- Radar model selection updates profiles/raw rows. Six-concern and eight-benchmark modes work; eight-axis source tables retain unavailable values honestly.
- Mobile dialogs fit the viewport. Long content scrolls internally while heading/close controls remain visible. Task tiers become one column without overlapping rows.
- The fallback loads its frozen script/core/style, renders the former scatterplot/shared controls, and switches family stages. Snapshot hashes protect all four fallback files.

Screenshots: [size-tier rankings](screenshots/modal-refinement/task-size-rankings.jpg), [model-scope popup](screenshots/modal-refinement/model-scope-popup.jpg), [mobile evidence](screenshots/modal-refinement/candidate-popup-mobile.jpg).

## Requirements and honest limits

The website has an explicit model-selection task, five distinct interactive views, source-linked real data, more than five meaningful interaction types, design/class rationale, findings, evaluation documentation and reproduction instructions. Counts remain **18,255 repositories** and **21,674 feedback records**; no data was deleted to simplify the interface.

These are structurally verified records, not independent inventions or independent users/reviews. Feedback labels and attribution have no measured human accuracy validation. Source settings can be incomplete; same-source grouping reduces mismatches but does not establish a controlled replication. Rank means one benchmark within a source group and parameter tier, not overall superiority or measured GPU requirements.

Sean's prior formative reviews and old-release workflow confirmation are in [user-review.md](user-review.md). Present checks are regression tests and agent-operated browser checks, not a new human study. No participant count, completion rate, label agreement or grade guarantee is invented.

## Recovery and publication

The [saved pre-revision page](../pre-modal.html) uses frozen `pre-modal.js`, `pre-modal.css` and `pre-modal-core.mjs`. Tag `pre-modal-redesign-2026-10-18` points to `bfe6314ea937c1bd37c42ce6eb77b31cb7a954de`, preserving the historical tree. Original interim/handoff pages remain. See [recovery instructions](redesign-and-rollback.md).

Implementation commit: [ae6903d](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/commit/ae6903d12fbe59001859d8d674768e413c8a4a77).

- [GitHub validation](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/actions/runs/39122604664): succeeded.
- [GitHub Pages deployment](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/actions/runs/39122604681): succeeded.
- At 11:18 UTC, all fifteen public implementation/data/fallback files returned over HTTPS and matched the locally tested files byte for byte. [Machine-readable result](../reports/production_release_check.json).
- The backup tag is pushed and the fallback page is published.
- The live page again timed out in the in-app browser. Interaction tests used the actual local deployment bundle; HTTPS/hash checks establish publication. No successful new live-browser interaction or human check is claimed.
