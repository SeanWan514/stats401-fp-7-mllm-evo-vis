# Canonical models and benchmark evidence

This pipeline builds a curated comparison layer above the larger repository ecosystem. It does not treat repositories, model variants, benchmark observations, or independent evaluations as interchangeable counts.

## Reproduce

Run from the repository root:

```sh
# Optional network acquisition: metadata, model cards and release evidence only.
/usr/bin/python3 scripts/build_final_models.py --fetch

# Offline rebuild from preserved evidence. No network or model weights needed.
/usr/bin/python3 scripts/build_final_models.py
```

Only the Python standard library is required. `/usr/bin/python3` uses the system certificate store on the collection machine; another Python installation with working HTTPS certificates is also suitable. Successful fetches are immutable caches. To update a source, archive its cached response and manifest before fetching a new snapshot; do not silently combine retrieval dates. A failed gated request is reported and is not bypassed.

The script writes both `data/final/benchmark_results.csv` for local use and a deterministic `benchmark_results.csv.gz` (`mtime=0`, empty embedded filename) for version control. A clean checkout can read the compressed file or rebuild the CSV. No model weights are downloaded and no benchmarks are rerun.

## Selection and identifiers

`config/canonical_models.json` is the reviewed manifest of exact official Hugging Face repositories. The current selection contains 57 variants across Qwen-VL, InternVL, LLaVA, MiniCPM-V/o, Molmo, Gemma, Phi vision/multimodal, Idefics, DeepSeek-VL and SmolVLM. It is a working comparison scope, not a population sample or a ranking of the best models.

- A canonical `id` is the lowercase repository identifier with punctuation collapsed to hyphens. Repository IDs and curated aliases are preserved explicitly; names are not fuzzy-matched.
- `models.json.models` contains the canonical selection. `models.json.baseline_models` registers all 285 existing OpenVLM entries, including unselected and closed-weight entries, and their exact-name crosswalk to the canonical layer. Those baseline-only entries are not added to the open-weight model count.
- A benchmark row uses the canonical ID when explicitly mapped, otherwise a stable `baseline:<slug>-<name hash>` ID registered in `baseline_models`. `is_canonical` and `canonical_model_id` identify rows eligible for the comparison layer.
- Official repository metadata must list weight files to establish `open_weight=true`. This does not imply unrestricted use or an OSI open-source license. `license`, custom license name/link and `gated` remain separate fields.
- `parameters_total_b` is the API's safetensors tensor count divided by 1e9 when available. It may include vision components and therefore differ from a model's nominal name. A missing count is not replaced with the advertised number. Activated parameters are populated only when explicitly stated in inspected evidence.

## Dates and provenance

Repository creation/modification dates are stored as repository metadata. They never become model release dates. `release_status=verified_day` requires a dated official announcement, with `release_date_scope` recording whether the announcement refers to an exact version or a series containing that variant. A card that only states a month receives `verified_month` and no invented day. Other release dates are `null` / `unknown` and must be excluded from the verified-release timeline.

The baseline says its snapshot date is September 17, 2025, but one of its metadata dates is in February 2026. All baseline metadata dates are retained as unverified observations, and the discrepancy is reported. “After snapshot” means a verified release after **2025-09-17**, not a recently modified model card. Qwen3-VL, Molmo2 and the October 2026 MiniCPM-V 4.7 variants have official post-snapshot release evidence.

Each fetched response has a separate manifest containing the requested/resolved URL, UTC retrieval timestamp, SHA-256 digest, byte count and selected HTTP response headers. The model table retains the HF repository revision. `models.json.provenance` records the exact baseline SHA-256. Source bodies are retained locally for verification and replay; redistribution must respect each source's applicable license/terms. Public metadata and a model-weight license do not automatically grant unrestricted redistribution of all accompanying source text.

## Benchmark preservation and extraction

Every finite numeric leaf outside `META` in the supplied `OpenVLM.json` is exported without changing its value. Its JSON-path pointer is preserved. This retains **142,843** original measurements, including detailed subcategories; it does not count them as models or independent experiments. Non-numeric missing values remain in the original raw JSON and are not converted to zero.

Official model-card Markdown and simple HTML tables are parsed in a second pass. Only explicitly curated exact model aliases are matched. Both self-reported results and comparison columns are retained with different `source_type` values. Image-only results are omitted unless separately transcribed from a directly inspected official table and recorded in the manifest as a manual observation. No score is inferred from narrative claims, graphics without readable values, another model's size, or benchmark coverage.

The official Qwen3-VL 4B/8B Instruct image table was directly inspected and 12 values were transcribed: MMMU validation, MathVista mini, MMBench **development** EN v1.1, HallusionBench, DocVQA test and OCRBench for each model. The image, its SHA-256, row/column locations and exact values are recorded in `config/canonical_models.json`. This was assistant visual transcription, not a human-labeled validation exercise. MM-Vet and ChartQA are absent from that table and remain missing for those two models. MMBench development values are never merged with the default pair's MMBench test values.

Each long-table row includes model, benchmark/version, split, metric, unit, setting ID, score, source URL, source pointer and comparability group. Unknown versions, splits, languages, prompt settings and metric definitions remain `unknown` or `reported_score`. A field such as `MMBench-Video` is not merged with image MMBench; MMMU-Pro, OCRBench v2 and MM-Vet v2 are not substituted into the proposed original dimensions. MMBench English/Chinese and DocVQA validation/test remain separate.

## Radar contract and limitations

Use **only** rows with `is_canonical=true`, `is_primary_metric=true` and `visualization_eligible=true`. Detailed benchmark subcategories must not be selected arbitrarily or maximized to fill a dimension. Compare two rows only within the same `comparability_group`; multiple conflicting observations in one group are an ambiguity to expose rather than average away.

The eight proposed dimensions are `mmmu`, `mathvista`, `mmbench`, `mmvet`, `hallusion`, `ocrbench`, `chartqa` and `docvqa`. Bounds are fixed in `models.json.metrics`: OCRBench v1 uses 0–1000 points; the selected bounded percentage-style dimensions use 0–100. These are not sample-dependent min/max ranges. Undocumented OCRBench rescalings, including some SmolVLM card values, are kept in the long table but receive no normalization bound and cannot fill the v1 radar dimension.

The recommended default pair is Qwen2.5-VL-7B-Instruct and Qwen2-VL-7B-Instruct, using the same performance table in the official Qwen2.5-VL-7B card. `reports/model_radar_coverage.json` records the exact permitted group and result IDs per dimension. The published table specifies MMMU validation, MathVista testmini, MMBench EN v1.1 test, ChartQA test, DocVQA test, and a GPT-4-Turbo judge label for MM-Vet. Other setting details remain unknown. HallBench is reported as `avg`; its exact aggregation formula is unspecified and is **not relabeled aAcc**.

`comparability_status=source_table_only` means the scores appear together in one official published table, while `unknown_settings` means the baseline does not expose the evaluation setup. Neither status establishes independently reproduced, fully controlled comparability. The matrix and evidence panel should show this qualification. Benchmark scores are not combined with mentions/downloads into an overall suitability score.

## Relationships and validation

`release_sequence` edges are computed from verified release dates within a family, using one deterministic representative per date. They describe chronology only and do not claim inherited weights. Both endpoints' release sources are recorded. `architecture_based_on` is a different edge type, used only for the explicit SmolVLM2–Idefics3 architecture statement; it also does not imply that the cited model's weights were fine-tuned. Unknown training ancestry stays unknown.

The build validates unique result/model IDs, registered benchmark and relationship references, available official weight metadata, normalization ranges and the recommended pair's published dimension coverage. It reports missing cards, unknown dates, missing benchmark dimensions and date anomalies in `reports/model_data_quality.json` and `reports/model_radar_coverage.json`. These are data integrity checks; they do not establish scientific comparability or verify the accuracy of publishers' reported scores.
