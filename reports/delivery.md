# Final data handoff — 2026-10-17

This branch delivers Shilin Ou's data acquisition, cleaning and preparation work and a working five-view integration preview. It supports the revised task: shortlist open-weight image-and-text models, compare benchmark results with reported experiences, and inspect tradeoffs and evidence gaps. The published interactive site is [MLLM Evidence Explorer](https://owen-1234.github.io/mllm-evidence-explorer/), maintained in a [dedicated visualization repository](https://github.com/Owen-1234/mllm-evidence-explorer). The source entry is [`final.html`](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/final.html).

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

Repository accounting: 24,182 observations → 20,497 unique repositories → 18,255 retained; 3,685 repeated observations and 2,242 exclusions. Family inference gives precedence to the model name, then explicit base models, then architecture tags. Training-dataset names do not establish model family. GGUF/MLX format alone does not establish quantization; 154 conflicting cases remain unresolved.

Feedback accounting: 45,047 observed objects → 37,738 unique source objects → 21,674 retained. PRs, known maintainers, bots, acknowledgements, unsupported topics, administrative material and other exclusions are reported separately. Quoted email tails are stripped before eligibility and labeling. Seventy-six explicit model-version conflicts are downgraded to family association.

Chinese **推理** is a reasoning-task candidate. Capability, mathematical, logical and visual contexts support the task; speed, memory, deployment and error contexts are runtime aspects. There are 109 reasoning-labeled records, with 368 ambiguous Chinese mentions retained as candidates and 318 runtime-context records distinguished explicitly. These remain unvalidated machine labels.

## Implemented views

The preview includes repository growth / verified releases, task exploration, family evolution, an eight-dimension two-model radar, and a task–model evidence matrix. Filters, brushing, task selection, model selection, evidence links, sorting and missing-data states operate on shared identifiers. The radar uses fixed scales and explicit protocol groups; missing values are gaps. The default pair has eight dimensions in the same official source table, with undisclosed evaluation details identified. This is not an independently reproduced controlled comparison.

## How the team can use this data next

### Integrate the final website

Use [data/final/view_data.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/view_data.json) as the browser input. It already contains models, tasks, families, time series, qualified scores, relationships, feedback aggregates and capped redacted excerpts. The working [final.html](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/final.html), [final.js](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/final.js) and [final.css](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/final.css) provide reference interactions that can be adapted to the team's final design. The browser does not need to download full feedback or the complete benchmark table.

Build the main journey around: **select a task → inspect evidence-backed candidates → check benchmark and community evidence → select two models → compare profiles and open sources**. Show evidence counts and missingness beside the candidate choices.

### Choose tables for the analysis question

Paths below are relative to the repository root.

| Question | Input | Suggested use |
| --- | --- | --- |
| How did the sampled repository ecosystem develop? | [data/final/repositories.jsonl](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/repositories.jsonl) | Count distinct repository IDs by creation month, family and repository type. Describe the surviving sample's creation-time distribution, not a complete historical census. |
| Which recent models have verified release evidence? | [data/final/models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/models.json) | Filter verified `release_date` values for a recent-release timeline and candidate metadata cards. Present month-only dates separately. |
| Which models have evidence for OCR, document understanding or reasoning? | [tasks.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/tasks.json), [models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/models.json), [benchmark_results.csv.gz](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/benchmark_results.csv.gz), [full feedback JSONL (gzip)](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/feedback.jsonl.gz) | Build the task–model matrix using explicit benchmark mappings, with score coverage and community evidence shown separately. |
| What tradeoffs appear between two candidates? | [models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/models.json), [benchmark_results.csv.gz](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/benchmark_results.csv.gz) | Show fixed-scale profiles and raw score tables within explicit protocol groups, retaining units, sources and gaps. |
| What practical issues are discussed? | [Full feedback JSONL (gzip)](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/feedback.jsonl.gz) | Summarize aspects, experience categories, platforms, periods and families; show a few redacted source examples. |
| How do releases and documented relationships connect? | [models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/models.json), [model_relationships.csv](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/model_relationships.csv) | Build a timeline with distinct edge styles for release chronology and architecture relationships. |

### Join and count consistently

- Canonical models use `models.json.models[].id`. Join benchmark rows through `canonical_model_id` and feedback through `model_ids`; do not fuzzy-join display names. The baseline registry retains older benchmark-only entries.
- Join `tasks.json.tasks[].id` to feedback `task_ids`; use each task's `benchmark_ids` and `mapping_rationale` for benchmark evidence.
- Use `family_id` for family summaries. Family-only comments stay at that level and never become evidence for every model variant.
- Count distinct repository or feedback IDs. A multi-task comment can enter several task buckets but counts once in the corpus denominator; task totals need not sum to the corpus total.
- For selected-model score views, require `is_canonical`, `is_primary_metric` and `visualization_eligible`, then inspect `comparability_group`, version, split, metric and unit. A shared source table still retains its undisclosed settings.

### Use an end-to-end example in the presentation

For a document OCR workflow, select OCR or document understanding, inspect the mapped OCRBench/DocVQA evidence, and narrow candidates using license, available parameter information and score coverage. Inspect relevant exact-model comments for recognition, memory or deployment issues, then compare two candidates and open their raw sources. Label family-only evidence explicitly. This journey can also become a task in the team's usability study; it does not require an invented overall suitability score.

### Reuse the material in the final report and poster

The methods section can document sources, collection dates, bounded queries, deduplication units, exclusions, attribution rules and missingness. Results can show ecosystem growth, task/benchmark coverage, practical issue themes and a candidate comparison case. Record each figure's filters and denominator.

Use [repository_counts.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/repository_counts.json), [feedback_quality.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/feedback_quality.json) and [model_data_quality.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/model_data_quality.json) for frozen totals, and cite [final_validation.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/final_validation.json) and [reproducibility.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/reproducibility.json) for structural and rebuild checks. For example, report that rules assigned a task to 1,965 of 21,674 retained feedback records, with rule-generated labels whose accuracy has not been measured. These records are not 1,965 independent users who completed a controlled task test.

### Update labels or extend the snapshot

Task definitions and feedback rules are in [scripts/process_feedback.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/scripts/process_feedback.py); curated model/source additions belong in [config/canonical_models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/config/canonical_models.json). Keep corrections in a separate versioned record and explicitly apply them during processing; direct edits to generated JSON will be overwritten. After cloning the group branch and running `python3 scripts/restore_public_data.py` in an empty checkout, or using existing complete caches, rerun:

```sh
python3 scripts/collect_repositories.py --process
python3 scripts/build_final_models.py
python3 scripts/process_feedback.py
python3 scripts/build_final_views.py
python3 scripts/validate_final_data.py
python3 scripts/build_static_site.py
```

These commands replay existing caches rather than collect a new time point. For longitudinal work, preserve the current raw caches, configuration, outputs and hashes first, then collect a separately dated snapshot using the pipeline guide. Track additions, changes and unavailable objects; retain download-counter windows and retrieval dates when comparing snapshots.

## Full feedback and raw-cache downloads

All data archives are published in the **group repository's `codex/final-data-pipeline` branch**, separately from the visualization repository.

- [Full feedback JSONL gzip](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/final/feedback.jsonl.gz): all 21,674 retained records.
- [Complete raw-cache archive](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/data/archives/raw-cache-2026-10-17.tar.gz): all 1,861 cached files, restoring the `data/raw/` tree.
- [Publication manifest and SHA-256 values](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/public_data_manifest.json): original/published file hashes and credential-redaction counts.
- [Restoration script](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/scripts/restore_public_data.py): verifies archive/member hashes and refuses to overwrite different local originals.

```sh
python3 scripts/restore_public_data.py
```

Only credential-like strings are masked in public copies; no feedback record or cache file is dropped. Local originals remain unchanged. Embedded acquisition hashes refer to original evidence, while the publication manifest records public-copy hashes. Existing local originals should be kept in place; skip restoration or choose a separate empty `--destination` directory. Rebuild the prepared tables once after restoration before checking repeated-build byte equality. Original source terms and attributions still apply.

## Verification

The repository, feedback and view regression suites contain 31 passing checks. [`final_validation.json`](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/final_validation.json) checks actual exported IDs, foreign keys, provenance, finite scores, independent volume targets and browser count reconciliation. [`model_validation.json`](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/model_validation.json) checks all 142,843 original numeric values and gzip round-trip equality. [`reproducibility.json`](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/reproducibility.json) records the full local offline rebuild and output SHA-256 values. Browser QA covers desktop/mobile layout, linked controls, empty states and source drill-down.

Reproduction commands and dependencies are in [the pipeline guide](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/docs/data-pipeline.md). A fresh clone includes prepared browser data, compressed benchmark rows, the full feedback gzip, and a full raw-cache archive. Run the restoration command below before the first offline rebuild. The static deployment workflow publishes only the explicit `dist/` allowlist.

## Remaining research work and limitations

- Eight supported task definitions are delivered; the suggested 10–20 taxonomy size is not met. Tasks must be expanded only with supported distinctions. A large corpus is not a large set of task-specific evaluations.
- Forty-nine canonical dates are verified to the day, two only to the month, and six remain unknown. Four gated model-card fetches remain unavailable; no access restriction was bypassed.
- Repository relevance/family/type and feedback labels are metadata/rule baselines, not a validated census. GitHub issues and HF discussions are selected populations; comment counts are not unique users or satisfaction ratings.
- The first full feedback acquisition retained normalized selected fields. The separately hashed API archive contains 92 successful responses plus four redirects from representative **later** snapshots. It does not recreate every first-fetch response. [Raw provenance report](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/feedback_raw_provenance.json).
- Final team narrative/report/poster and actual usability-study participation require the responsible teammates. This handoff does not claim that the whole course project has passed final acceptance.

See [repository counts](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/repository_counts.json), [feedback quality](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/feedback_quality.json), [model quality](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/reports/model_data_quality.json), [model methodology](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/docs/model-methodology.md) and [feedback methodology](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/codex/final-data-pipeline/docs/feedback-methodology.md) for the complete boundaries and evidence.
