# Final data implementation plan

- Owner: Shilin Ou / Owen, STATS 401 Group 7.
- Shared branch: [shilin](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/tree/shilin).
- Snapshot date: 2026-10-17.
- Status: implemented data handoff and integration preview; empirical label accuracy and controlled benchmark comparability are not established.
- Results: [English delivery report](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/delivery.md). For commands, start with the [quick start](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/quickstart.md).

## User task

Help researchers and developers shortlist open-weight image-and-text models for a task, compare benchmark and community evidence, inspect tradeoffs, and follow the evidence to its source. The workflow is: select a task → inspect candidates → compare two models → check release context and practical observations.

## Scope and independent counting units

| Layer | Target / scope | Delivered | Counting rule |
| --- | --- | ---: | --- |
| Repository ecosystem | At least 10,000 related repositories | 18,255 | One retained stable HF repository ID; derivatives are classified separately |
| Canonical comparison models | Suggested 40–60 exact variants | 57 across 10 families | Exact official size/version/instruction variant |
| Community feedback | At least 10,000 retained objects | 21,674 | One source issue body or comment; titles, sentences and labels do not inflate counts |
| Task definitions | Suggested 10–20 supported tasks | 8 | Definitions require real evidence; unknown/ambiguous cases remain explicit |
| Benchmark table | Preserve baseline; add official evidence | 143,086 rows | One reported model–benchmark–setting–metric–source measurement |
| Relationships | Sourced typed edges | 15 | Release chronology is distinct from architecture or weight derivation |

Feedback totals also report task-labeled, exact-model, family-only, experience-type and unclassified subsets. A record can support multiple tasks but counts once in the corpus denominator. There are 1,965 task-labeled and 1,507 canonical-model-linked feedback records.

## Processing stages

| Stage | Implementation | Output / gate |
| --- | --- | --- |
| Requirements and baseline | Read the revised task, inspect existing code and preserve the supplied baseline | Explicit units, identifiers and source boundaries |
| Pilot collection | Exercise pagination and filtering on actual HF/GitHub samples | Pilot reports establish implementation behavior, not final population estimates |
| Repository collection | Query popular and recently created image-text repositories, supplement with caption/VQA tags | Unique screened repository table and exclusion reasons |
| Model evidence | Curate exact official variants, verify weights/licenses/dates, retain baseline measurements | Canonical registry, benchmark long table, typed relationships |
| Feedback collection | Page actual GitHub issue/comment objects and HF discussion comment events | Cached objects, source timestamps and retrieval metadata |
| Feedback processing | Deduplicate, remove unsupported content, infer tasks/aspects/polarity and attribution | Feedback and task tables, explicit unknowns and rule evidence |
| Integration | Join through canonical model, family and task IDs | Lightweight payload and five coordinated views |
| Handoff checks | Rebuild offline, validate tables, test contracts, exercise the browser | Reports, archive checksums, commands and documented limitations |

## Repository and model evidence rules

Use official HF metadata, model cards, release announcements and model repositories. Do not download model weights or run source-repository code. Follow pagination and bounded retries; keep query information, timestamps, revision IDs and source hashes.

Repository family inference gives precedence to the model name, then explicit base models, then architecture tags. Dataset tags do not define model identity. Exclude explicit random/test repositories, known text-only variants and contradictory non-generative task evidence. Unknown cases remain unknown.

Treat repository creation, repository modification and verified model release as separate dates. A recently created derivative does not establish a newly released base model. Eleven selected models have verified releases after the 2025-09-17 baseline; ten were released from 2025-10-01 onward. Forty-nine dates are day-level, two month-level, and six unknown.

Keep original releases, fine-tunes, adapters, quantization and format conversion distinguishable. GGUF/MLX alone is format evidence, not proof of lower-bit quantization. Stored tensor counts, total parameters and active parameters have separate scopes. Missing licenses do not imply unrestricted use.

## Benchmark rules

Preserve all 142,843 numeric leaves from the baseline without changing values. Register baseline-only entries separately from canonical models. Add official Markdown/HTML table values and explicitly recorded visual transcriptions without inventing missing scores. No benchmark is rerun in this handoff.

The eight proposed dimensions are MMMU, MathVista, MMBench, MM-Vet, HallusionBench, OCRBench, ChartQA and DocVQA. Preserve benchmark version, language, split, metric, raw unit, setting, source type and source pointer. Incompatible variants remain separate.

Use fixed scales and explicit comparison groups. Missing values are gaps, not zero. A shared official table is qualified as source-table evidence, not independently reproduced controlled evaluation. Do not select the maximum or average conflicting values merely to fill a dimension. Unknown model ancestry remains unknown.

## Community feedback rules

Sources are actual GitHub issue bodies/comments in dedicated official model-family repositories and HF discussion comment events in exact model repositories. Reddit and GitHub Discussions are not claimed as collected sources.

- Identify each object by platform, object type and stable source ID.
- Remove PRs, known maintainer/bot material, acknowledgements, administrative/promotional content and unsupported modality-only topics.
- Remove quoted email tails, empty forms and code-only content before substantive-text checks.
- Preserve text, language, thread, timestamps, platform and source links. Publication copies mask credential-like strings and retain all intended records/files.
- Keep canonical-model, exact-repository, family-only, conflicting and unknown association separate. Family-only comments never become evidence for every variant.
- Assign task labels from direct context, with unknowns and candidates preserved. The Chinese term that can mean reasoning or inference uses capability/math/logic/visual context for the reasoning task and speed/memory/deployment/error context for runtime aspects.
- Keep clause-level aspect polarity. Accurate-but-slow observations can be positive on accuracy and negative on latency. Sentiment and numeric confidence are transparent heuristics rather than measured accuracy or calibrated probabilities.

Community platforms are selected populations. Comments are not independent users or a representative satisfaction survey; thread follow-ups can be dependent observations.

## Five-view integration contract

| View | Data supplied | Acceptance behavior |
| --- | --- | --- |
| Ecosystem growth | Repository creation, family/type and separately verified releases | Modes and denominators remain distinct; filters reconcile |
| Task explorer | Definitions, distinct task counts, mapping reasons and source excerpts | Ranked counts accompany phrases; task selection links to matrix |
| Family evolution | Exact variants, date precision and typed sourced edges | Chronology is visually distinct from architecture relationships |
| Two-model radar | Qualified scores, fixed bounds, explicit protocol groups and metadata | Source values and missing axes remain visible |
| Task–model matrix | Task–benchmark mappings, canonical/family evidence and coverage | Benchmark dimensions, rule-inferred experience and comments stay separate |

The frontend uses the prepared [view payload](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/view_data.json). The [view contract](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/final-view-contract.md) documents identifiers, filters, B/E/C cells and missingness. The final explorer is published in its own website repository; the shared branch retains the data pipeline and full archives.

## Reproduction and release

Restore published archives only in a fresh clone or separate empty destination. Process repository, model and feedback layers before building browser data. Validate actual-table IDs, joins, provenance, score validity and count reconciliation. After an initial reconstruction, verify byte-identical repeated builds.

[Complete public archives](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/archives/README.md) include all 1,861 cached files and all 21,674 retained feedback records. The [publication manifest](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/public_data_manifest.json) distinguishes source and public-copy hashes where credentials were masked. Initial feedback caches preserve normalized selected fields; representative later API-response snapshots are not a reconstruction of every first-fetch body.

Completed checks include 31 regression fixtures, baseline numeric preservation, local repeated-build equality, independent public-archive reconstruction, desktop/mobile rendering, shared controls, source links and empty/missing-data states. These establish implementation integrity, not label accuracy or causal claims. The team's remaining work includes final narrative, usability evaluation, poster and the supported expansion of task categories.
