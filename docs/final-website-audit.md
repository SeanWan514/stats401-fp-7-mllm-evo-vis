# Website audit · fourteen-page presentation

18 October 2026. Scope: website, prepared data and implementation. The report, poster, presentation and Canvas submission remain separate deliverables.

## Release status

**Technical website release: GO.** The assembled release passes all 65 tests, syntax, data-validation and build checks. GitHub validation and Pages deployment succeeded; all 23 checked published implementation/data/fallback files match the tested version byte for byte.

The [previous release audit](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/07b158262cc0259f6d992cd29b249c4cffe62949/docs/final-website-audit.md) preserves the modal revision's tests and release decision. Its GO does not automatically apply to this fourteen-page revision.

## Requested layout

The site now follows the exact fourteen-page sequence:

1. Pink centered cover: “MLLMs: Which Model for Your Task?”
2. Former headline, authors and four dataset summaries only.
3. Pink mission with the three requested user goals.
4. MLLM definition, context, audience and motivation.
5. Pink overview of five visualizations, questions and goals.
6. Two-dataset spotlight with sources, acquisition, cleaning, attributes and source/processed-data links.
7. Ecosystem growth.
8. User-concern cloud.
9. Model releases, families and performance.
10. Standalone A/B capability radar.
11. Task/size-tier selection, initially **Visual question answering**.
12. Pink conclusion with the three existing evidence-backed findings.
13. Methods, review record, limitations and future work, with details on demand.
14. Pink closing question, authors, course and recovery/repository links.

One page is active at a time. Progress buttons, previous/next controls, keyboard handling and hash/history navigation provide access. The implementation includes a 180 ms directional fade and reduced-motion handling. Wide-screen task tiers use four columns; the family page has a sidebar arrangement for its text and controls. Both final arrangements passed desktop visual inspection. On narrow screens, long content scrolls within the current page rather than shrinking to unreadable text.

The five charts retain their data and rendering logic. The requested initial task and page-navigation handoff are isolated from chart calculations. Regression coverage checks chart interiors, render/analysis function preservation, original dialogs and frozen fallback assets. See [the layout checklist](slide-layout-checklist.md).

## Local verification recorded so far

- **65 tests passed in the combined run: 31 Python and 34 JavaScript.** Syntax, data validation, static build and whitespace checks also passed.
- All fourteen pages were inspected locally at **1280 × 720** and **390 × 844**. The narrow-screen check found no horizontal page overflow. Exactly one page was active and thirteen were inert. Final desktop content bounds fit between the navigation bars; the family sidebar and four-column task board passed visual inspection.
- Growth grouping and month inspection were exercised. The inspector's Home key remained within the chart rather than navigating the presentation.
- Concern selection opened its evidence dialog; task handoff selected the corresponding task page. Browser back/forward restored the expected navigation.
- All three family stages, search and model-details dialogs were exercised.
- Radar Model B changes updated the comparison; raw-score/source access worked.
- Task-candidate dialogs worked, including mobile closing and keyboard focus return.
- All twelve guidance buttons opened the intended named dialogs with focus inside. Three dynamic evidence dialogs also worked. Escape, close controls and backdrop dismissal passed. Home/End navigation respects first/last boundaries and yields to chart controls and open dialogs.
- The saved scrolling fallback loaded its frozen assets and rendered the previous site, with no recorded console warnings/errors. The new site also had no recorded console warnings/errors in the checked session.
- Existing source/content checks found fourteen pages in the requested order. Pages 4–5 supply Why–What–How and explicit questions; page 6 supplies collection/cleaning counts and usable source/cleaned/code links.

These are agent-operated local browser checks and regression evidence, not a new human usability study or a successful live-production check. Screenshots: [cover](screenshots/slide-layout/cover.jpg), [data spotlight](screenshots/slide-layout/data.jpg), [task selection](screenshots/slide-layout/task-selection.jpg).

## Professor requirements and evidence integrity

| Website requirement | Evidence retained |
| --- | --- |
| Topic, questions, goals | Opening context, mission, audience and five question-led goals explain why model choice matters, what evidence is needed and how exploration supports it. |
| Acquisition, cleaning, analysis | Two documented collections exceed the reported separate 10,000-record targets. Sources, processing ledgers, categorical/temporal/numerical attributes, prepared data and reproduction code remain linked. |
| Five interactive idioms | Stacked area, phrase cloud, staged timeline/hierarchical packing/distribution, radar and size-tier ranked bars remain distinct. Hierarchy, text and multidimensional comparison provide complex representations. |
| Meaningful interactions and story | Category reordering, filtering, selection, search highlighting, stage/variable switching, A/B comparison, sorting and evidence drill-down support the sequence from context to a task-specific choice. |
| One coherent website | Fourteen pages remain in one HTML website with consistent navigation, explanations and dialogs. GitHub Pages deployment and HTTPS file verification passed. |

The data remains **18,255 unique retained HF repositories** and **21,674 distinct feedback posts/comments**. Repositories include derivatives; feedback records are not independent people or verified product reviews. No records were deleted to simplify this layout.

Fifteen pre-2023 repositories remain in the cumulative baseline: January 2023 shows 18 and the final repository total is 18,255. The curated comparison set remains 57 models across 10 families, with 49 verified release dates. Eight tasks remain in the data; five have supported measured choices in the selector.

Feedback labels/model attribution have no measured human accuracy validation. Benchmark settings can be incomplete. A same-source, size-tier leader is not a universal best model, and parameters are not measured GPU-memory requirements. These caveats remain available without overwhelming the chart pages.

Sean's prior feedback and workflow confirmation remain version-scoped in [user-review.md](user-review.md). No new participants, completion rates, annotation agreement or full-score/class-rank guarantee are claimed.

## Recovery and publication

The [saved scrolling version](../pre-slides.html) uses five frozen dependencies: `pre-slides.js`, `pre-slides.css`, `pre-slides-core.mjs`, `pre-slides-dialogs.css` and `pre-slides-task-selection.css`. Tag `pre-slides-layout-2026-10-18` points to `07b158262cc0259f6d992cd29b249c4cffe62949`, preserving the complete historical tree. D3/data remain shared in the immediate fallback; the tag provides their historical copies. Earlier pre-modal, interim and handoff views remain intact. See [recovery instructions](redesign-and-rollback.md).

Implementation commit: [e222d23](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/commit/e222d23c44001758a0da8ee449ff44d437cac0d2).

- [GitHub validation](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/actions/runs/39138568064): succeeded.
- [GitHub Pages deployment](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/actions/runs/39138568027): succeeded.
- At 15:03 UTC on 18 October 2026, all 23 public files returned over HTTPS and matched the tested files. [Machine-readable report](../reports/production_release_check.json).
- The rollback tag is pushed and its saved scrolling page is published.
- The in-app browser timed out opening production. Interaction checks used the actual local deployment bundle; HTTPS/hash checks establish publication. No successful new live-browser interaction or human check is claimed.
