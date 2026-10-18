# Modal and task-selection refinement · 18 October 2026

Status: implemented and deployed; 57 regression tests, local-browser checks, GitHub validation and fifteen-file published-byte verification passed. This checklist is not a prediction of the course grade. The website audit distinguishes local interaction tests from publication checks and records the live in-app browser timeout.

## Six requested areas

| Area | Implemented change | Acceptance checks |
| --- | --- | --- |
| 1. Ecosystem growth | The Hugging Face timeline starts in January 2023. Smooth filled layers preserve cumulative totals; category selection moves a layer to the baseline. The time strip inspects a month through hover, tap or keyboard instead of changing the date window. Reading/counting details open in a modal. | Confirm the first displayed month, exact month counts, mouse/touch inspection, keyboard arrows/Home/End, category reset and the separate verified-release mode. |
| 2. User concerns | The phrase cloud remains the main view. A selected phrase opens its count, examples and measurement context in a modal. The feedback guide contains corpus size, acquisition counts, exact rankings, source selection and classification limits. | Check all positive-count phrases, filter/count agreement, example links and the supported-task navigation button. |
| 3. Model families | The same 57 curated model marks move through release, family and performance stages. The guide explains why the comparison set is smaller than the repository collection; selecting a model opens source details. | Check three-stage transitions, consistent identities, search, score/source changes, missing-data areas and model-detail opening/closing. |
| 4. A/B comparison | The radar has its own A/B selectors. It is independent of the family-detail and task-candidate panels. Explanations and raw scores are available in modals. Candidate pairs must share at least four measured dimensions; the default profile uses six measured user-concern proxies, with an eight-benchmark alternative. | Check both selectors, any disclosed partner adjustment, raw-source changes, fixed scales, missing scores and both profile modes. |
| 5. Task-based choice | The task view uses separate ranked rows within four parameter-size tiers. It shows up to three leading measured models per tier on common benchmark scales; a complete candidate list retains other models and evidence gaps. Size/license filters remain available. | Check all five supported tasks, tier boundaries, ties, source-consistent scores, filtering, empty states and complete-list drill-down. |
| 6. Overall clarity and information access | Five numbered chapters retain the story. Explanations and evidence move into native dialogs instead of competing with the charts. The sticky shared-control/shortlist interface is removed; A/B comparison remains in its own chapter. | Verify desktop/mobile layout, dialog focus containment and restoration, Escape/close/outside-click behavior, navigation, links and the saved fallback. |

## Counts and interpretation safeguards

- The collection remains **18,255 unique retained Hugging Face repositories**. It includes original distributions and derivatives; it is not a count of independently invented models.
- **15 repository records predate January 2023.** They remain in the cumulative baseline. January 2023 therefore shows **18 cumulative repositories**, and the final cumulative total remains **18,255**. Smooth curves connect monthly totals; they do not add daily observations.
- Verified canonical releases keep their own source-verified dates. Their earliest retained month is October 2023; repository creation is not substituted for release date.
- The feedback corpus remains **21,674 distinct posts/comments**, not independent people or product reviews. Concern labels are rule-generated and remain unvalidated by a human accuracy study.
- The comparison set remains **57 canonical models across 10 families**, including **49 verified release dates**. It is curated rather than a random or exhaustive subset of the ecosystem.
- **Eight task categories remain in the dataset.** The selector exposes only the **five** with supported measured comparisons: visual question answering, OCR/text extraction, document understanding, chart/table understanding, and visual/mathematical reasoning. Image description, multimodal conversation and video understanding remain in the feedback corpus; unsupported performance recommendations are not invented.
- Size tiers are **≤4B**, **>4–10B**, **>10–40B**, and **>40B** total parameters. They are comparison bins, not measured memory requirements. “Highest score” is scoped to the selected benchmark, source group and tier, not overall model quality.
- Feedback source/type filters apply to the concern cloud. Task-candidate discussion evidence and the standalone radar retain their own stated scopes. Mention frequency is never converted into a model-quality score.

## Preserved fallback

The pre-revision release is tagged `pre-modal-redesign-2026-10-18` at commit `bfe6314ea937c1bd37c42ce6eb77b31cb7a954de`.

The saved [pre-modal page](../pre-modal.html) references `pre-modal.js`, `pre-modal.css` and `pre-modal-core.mjs`: four saved files in total. The JavaScript import points to the saved core module. Bundled D3 and the data payload remain shared; the Git tag preserves the complete historical source and data if those dependencies change later. Earlier interim/handoff fallbacks remain available.

See [the recovery log](redesign-and-rollback.md) for the safe rollback approach. Do not force-push or reset shared `main`.

## Verification and release gate

- [x] Run the complete regression/syntax checks: 57 tests pass.
- [x] Complete desktop and narrow-screen interaction checks, including dialog focus restoration.
- [x] Verify the six implementation areas with actual project data; see the audit for tested behaviors and scope.
- [x] Build the static bundle and confirm the saved fallback and all required assets are included.
- [x] Commit and push the assembled revision and backup tag; validation and Pages deployment succeeded.
- [x] Verify fifteen published files against the tested bundle, recording evidence and limits. The live browser timed out; workflows were tested locally, not claimed as a new successful live interaction test.

The [website audit](final-website-audit.md) is the release-status record. Earlier user checks and deployment results apply to their recorded versions; they are not silently transferred to this revision. Report, poster and presentation work remain separate from website verification.
