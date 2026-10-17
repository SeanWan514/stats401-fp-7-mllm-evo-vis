# Final data handoff — 2026-10-17

This branch delivers Shilin Ou's data acquisition, cleaning and preparation work and a working five-view integration preview. It supports the revised task: shortlist open-weight image-and-text models, compare benchmark results with reported experiences, and inspect tradeoffs and evidence gaps. The prepared preview is [`final.html`](../final.html).

## Delivered data

| Layer | Delivered | Meaning |
| --- | ---: | --- |
| HF repository ecosystem | 18,255 | Unique, metadata-supported repositories after filtering; includes derivatives, not 18,255 original architectures. |
| Canonical comparison models | 57 across 10 families | Exact official variants, with weight/license evidence and explicit missing values. |
| Recent canonical releases | 11 after the 2025-09-17 baseline; 10 from 2025-10-01 onward | Official dated release evidence; repository creation is not used as release date. |
| Benchmark measurements | 143,086 | All 142,843 original numeric measurements, plus 231 card-table and 12 directly inspected figure values. No benchmark was rerun. |
| Model relationships | 15 | 14 release-sequence edges and one sourced architecture relationship. Chronology does not imply inherited weights. |
| Community feedback | 21,674 | Unique filtered source bodies/comments: 19,547 GitHub community objects and 2,127 HF objects with unknown author role. |
| Task-labeled feedback | 1,965 | Rule suggestions across 8 task definitions; 19,709 records remain task-unclassified. |
| Canonical-model-linked feedback | 1,507 | Contextual association to a selected exact model; not proof that the author tested that version. |
| Human annotation worksheet | 250 real records | Blank human fields; zero records claimed human validated. Stored locally. |

Repository accounting: 24,182 observations → 20,497 unique repositories → 18,255 retained; 3,685 repeated observations and 2,242 exclusions. Family inference gives precedence to the model name, then explicit base models, then architecture tags. Training-dataset names do not establish model family. GGUF/MLX format alone does not establish quantization; 154 conflicting cases remain unresolved.

Feedback accounting: 45,047 observed objects → 37,738 unique source objects → 21,674 retained. PRs, known maintainers, bots, acknowledgements, unsupported topics, administrative material and other exclusions are reported separately. Quoted email tails are stripped before eligibility and labeling. Seventy-six explicit model-version conflicts are downgraded to family association.

Chinese **推理** is a reasoning-task candidate. Capability, mathematical, logical and visual contexts support the task; speed, memory, deployment and error contexts are runtime aspects. There are 109 reasoning-labeled records, with 368 ambiguous Chinese mentions retained as candidates and 318 runtime-context records distinguished explicitly. These remain unvalidated machine labels.

## Implemented views

The preview includes repository growth / verified releases, task exploration, family evolution, an eight-dimension two-model radar, and a task–model evidence matrix. Filters, brushing, task selection, model selection, evidence links, sorting and missing-data states operate on shared identifiers. The radar uses fixed scales and explicit protocol groups; missing values are gaps. The default pair has eight dimensions in the same official source table, with undisclosed evaluation details identified. This is not an independently reproduced controlled comparison.

## Verification

The repository, feedback and view regression suites contain 28 passing checks. [`final_validation.json`](final_validation.json) checks actual exported IDs, foreign keys, provenance, finite scores, independent volume targets and browser count reconciliation. [`model_validation.json`](model_validation.json) checks all 142,843 original numeric values and gzip round-trip equality. [`reproducibility.json`](reproducibility.json) records the full local offline rebuild and output SHA-256 values. Browser QA covers desktop/mobile layout, linked controls, empty states and source drill-down.

Reproduction commands and dependencies are in [the pipeline guide](../docs/data-pipeline.md). A fresh clone includes prepared browser data and compressed benchmark rows. Full feedback and raw caches are part of the local research handoff; they are required for the full offline rebuild. The static deployment workflow publishes only the explicit `dist/` allowlist.

## Remaining research work and limitations

- Sean and a second real annotator must complete the planned human review, agreement and held-out accuracy assessment. Regression tests do not measure labeling accuracy. The supplied 250-row worksheet is ready for that work.
- Eight supported task definitions are delivered; the suggested 10–20 taxonomy size is not met. Tasks must be expanded only with supported distinctions. A large corpus is not a large set of task-specific evaluations.
- Forty-nine canonical dates are verified to the day, two only to the month, and six remain unknown. Four gated model-card fetches remain unavailable; no access restriction was bypassed.
- Repository relevance/family/type and feedback labels are metadata/rule baselines, not a fully human-audited census. GitHub issues and HF discussions are selected populations; comment counts are not unique users or satisfaction ratings.
- The first full feedback acquisition retained normalized selected fields. The separately hashed API archive contains 92 successful responses plus four redirects from representative **later** snapshots. It does not recreate every first-fetch response. [Raw provenance report](feedback_raw_provenance.json).
- Final team narrative/report/poster and actual usability-study participation require the responsible teammates. This handoff does not claim that the whole course project has passed final human acceptance.

See [repository counts](repository_counts.json), [feedback quality](feedback_quality.json), [model quality](model_data_quality.json), [model methodology](../docs/model-methodology.md) and [feedback methodology](../docs/feedback-methodology.md) for the complete boundaries and evidence.
