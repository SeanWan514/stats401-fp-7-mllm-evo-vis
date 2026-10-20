# Fourteen-page website layout checklist · 18 October 2026

Scope: reorganize the existing website into fourteen navigable pages, with one page visible at a time. Preserve the five charts and their data/interaction semantics; the sole requested chart-default change is **Visual question answering** for View 5. Responsive sizing is permitted to fit each page.

Status: source/content review, local acceptance checks, all 65 tests, GitHub validation, Pages deployment and 23-file HTTPS verification pass. **Technical website release: GO.** The audit records the production in-app browser limitation separately.

## Exact page sequence

| Page | Required content and layout | Acceptance condition |
| --- | --- | --- |
| 1 | Pink cover; centered title **“MLLMs: Which Model for Your Task?”**, with the line break after “MLLMs:”. | No competing body content; readable title on desktop and narrow screens. |
| 2 | The former opening headline, authors and four numerical dataset summaries only. | Remove its eyebrow, introductory paragraph, mission block, action links and visible snapshot/loading line. Retain Sean Wan first in the author line. |
| 3 | Pink **Mission** page with three points: understand the ecosystem and user needs; compare measured capabilities; choose candidates for an image-and-text task and model-size budget. | The intended user outcome is explicit; do not claim a guaranteed best model or hardware suitability. |
| 4 | Introductory context, headed **“BEFORE WE BEGIN A LITTLE CONTEXT”** and **“What are MLLMs and What makes a model multimodal?”** | Define MLLMs, the image-and-text scope, open-weight licensing distinction and intended researcher/developer audience. |
| 5 | Pink **“OUR FIVE VISUALIZATIONS AND GOALS”** page listing all five views and their goals. | The first five pages collectively explain why the topic matters, what questions/data matter and how the visuals help answer them. |
| 6 | Two-dataset spotlight: **18,255 model repositories** and **21,674 feedback records**. | Include sources, acquisition, cleaning, attributes, analytical uses and source/processed-data links; distinguish repositories, canonical models and discussion records. |
| 7 | View 1: ecosystem growth. | Existing smooth cumulative areas, category comparison, month inspection and guide remain functional on their own page. |
| 8 | View 2: user-concern phrase cloud. | Existing responsive phrases, exact counts, evidence filters, source examples and task navigation remain functional. |
| 9 | View 3: three model perspectives. | Existing release → family → performance stages, model identity, search, controls and evidence dialogs remain functional. |
| 10 | View 4: standalone A/B radar. | Existing pair selectors, shared-source comparison, alternate profile and raw-score dialogs remain functional. |
| 11 | View 5: task and size-tier model selection. | Open by default on **Visual question answering**; preserve filters, tier rankings, complete candidate list and source evidence. |
| 12 | Pink conclusion page retaining the three existing data-backed highlights in concise form. | Preserve the quantified findings and their interpretation limits; do not replace evidence with generic success claims. |
| 13 | Methods, brief review record, limitations and future work. | Existing methodological details and popups remain accessible; earlier project-member review is not presented as a new independent usability study. |
| 14 | Pink closing page, centered **“So now: are you ready for selecting your MLLM?”** | Authors and the STATS 401 footer appear below; repository, audit and fallback access remain available without obscuring the closing message. |

The implementation supplies a top progress indicator, left/right controls and keyboard navigation. One page is active; inactive pages are inert. A 180 ms directional fade has reduced-motion handling. Navigation preserves chart deep links and browser history; dialogs and native form controls keep their own keyboard behavior. The wide-screen four-column task rankings and family-control sidebar passed the final local visual review.

## Five professor requirement areas

| Requirement area | Evidence the layout must retain | Final acceptance gate |
| --- | --- | --- |
| **1. Topic, questions and goals** | Pages 2–5 introduce the MLLM-selection problem, researcher/developer audience and an evidence-supported candidate-selection task. The visual goals address ecosystem growth, user concerns, family differences, two-model capabilities and task-specific choice. | The opening must answer **Why** the choice is difficult, **What** evidence is needed, and **How** visualization supports it; goals must be specific enough to guide exploration. |
| **2. Data acquisition, cleaning and analysis** | Page 6 and its source links document 18,255 retained HF repositories and 21,674 retained GitHub/HF discussion records. Model attributes include identifiers, families/types, dates, licenses, parameter counts and benchmarks. Feedback attributes include source IDs, dates, text, model/family associations, task/concern labels and evidence type. | Both collections exceed the reported instructor's separate 10,000-record targets. Explain categorical, temporal and numerical attributes; retain original/source material, cleaned tables and scripts. Do not equate derivatives with new models, comments with people, or benchmark rows with extra model records. |
| **3. Visualization design and interaction** | Pages 7–11 preserve five distinct idioms: stacked area, phrase cloud, staged timeline/hierarchical packing/distribution, radar, and size-tier ranked score bars. Hierarchical packing, text and multidimensional comparison supply complex representations. | At least five meaningful interactions must remain working, beyond tooltips: category reordering, source/evidence filtering, phrase/model selection, search highlighting, stage/variable switching, A/B comparison, candidate sorting and size/license filtering. Each chart must remain programmatically generated and interactive. |
| **4. Storytelling and meaningfulness** | The sequence is context/mission → questions/goals → data → ecosystem → needs → families → detailed comparison → task-based choice → findings → limits. The three conclusion findings summarize derivative prevalence, sparse task labeling and limited exact-model attribution. | Transitions must make each chart's role understandable. Conclusions remain scoped to the collected snapshot, with explicit evidence gaps rather than causal or universal-best-model claims. |
| **5. One coherent published website** | All fourteen pages remain within one HTML website, with consistent controls, visual style, progress navigation, reading guides, source links and responsive layouts. | Static build, asset/link checks, deployed website availability and key live workflows must be verified for this release. A local layout is not proof of successful publication. |

### Count and evidence invariants

- **18,255 repositories**, including **15 pre-2023 records** retained in the cumulative baseline. January 2023 cumulative count remains **18**; cropping the displayed period does not discard those records.
- **21,674 feedback records**, including **1,965 task-labeled records**. Rule labels remain without measured human accuracy; discussion frequency is not performance or a representative preference survey.
- **57 canonical models**, **10 families**, **49 verified release dates**. Canonical comparisons and ecosystem volume remain distinct scopes.
- **Eight tasks in the data**, **five supported task choices** in the measured selector. The default becomes visual question answering; unsupported tasks are not silently given scores.
- Radar comparisons retain fixed scales, source-group checks and missing-data gaps. Parameters do not guarantee GPU-memory needs; unmeasured latency/memory remain limitations.
- Earlier user checks remain attributed to the version and single project-member reviewer recorded in [user-review.md](user-review.md). No new participants or label-validation results are implied by this layout change.

## Preservation and recovery

Tag `pre-slides-layout-2026-10-18` resolves to `07b158262cc0259f6d992cd29b249c4cffe62949`, the release before this layout change.

The fallback comprises six saved files: `pre-slides.html`, `pre-slides.js`, `pre-slides.css`, `pre-slides-core.mjs`, `pre-slides-dialogs.css` and `pre-slides-task-selection.css`. The saved page/scripts reference the frozen assets. Bundled D3 and the data payload remain shared; the tag preserves their historical versions for complete recovery. Older interim, handoff and pre-modal fallbacks remain intact.

## Recorded checks and remaining release gates

- [x] Source/content review: exactly fourteen pages, correct order and required introductory/data/method content.
- [x] Final local review of all fourteen pages: bounds fit at 1280 × 720; no horizontal overflow at 390 × 844; one active page and inactive pages inert.
- [x] Local chart checks: growth grouping/month inspection and protected Home key; cloud evidence → task-page handoff and back/forward navigation; all family stages/search/model details; radar Model B changes/raw sources; candidate details and mobile focus return.
- [x] View 5 initial task changed to visual question answering. Preservation tests cover chart interiors/rendering logic, dialogs and saved assets.
- [x] Final visual confirmation of the family-sidebar layout, four-column wide task layout and directional transitions, including narrow-screen recheck.
- [x] Final combined regression/syntax/static-build checks: all **65 tests pass**, comprising 31 Python and 34 JavaScript checks.
- [x] Final navigation/dialog and fallback check: all 12 static and 3 dynamic dialogs passed closing, Escape/outside-click and focus checks; the saved scrolling fallback loads without errors.
- [x] Implementation and rollback tag pushed; GitHub validation and Pages deployment succeeded. All 23 checked public assets match the tested version. Production in-app browser navigation timed out; the audit distinguishes local interaction checks from HTTPS publication verification.

Record final release evidence in [the website audit](final-website-audit.md). This website checklist does not certify the separate report, poster, presentation or a particular grade.
