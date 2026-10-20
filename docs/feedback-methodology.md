# Data acquisition and handoff

This branch implements Shilin Ou's data work and a five-view integration preview at [final.html](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/main/final.html). The original interim page remains at [index.html](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/main/index.html). The revised user task is to shortlist open-weight image-and-text models, compare benchmark and reported-experience evidence, and expose tradeoffs and evidence gaps.

## Files and units

| File | Unit / join key | Interpretation |
| --- | --- | --- |
| [data/final/repositories.jsonl](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/main/data/final/repositories.jsonl) | One HF repository; `id`, `repo_id` | Metadata-supported ecosystem sample, including derivatives. Not a count of independent original models. |
| [data/final/models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/main/data/final/models.json) | `models[].id` | Curated canonical models; `baseline_models` separately registers all original OpenVLM records and crosswalks. |
| `data/final/benchmark_results.csv` | Unique `result_id` | One reported model–benchmark–version–split–setting–metric–source measurement. |
| [data/final/benchmark_results.csv.gz](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/main/data/final/benchmark_results.csv.gz) | Same rows, lossless gzip | Version-controlled compressed copy; the CSV remains available locally. |
| [data/final/model_relationships.csv](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/main/data/final/model_relationships.csv) | Source and target canonical IDs | Typed, sourced edges. `release_sequence` is chronology, never an ancestry claim. |
| `data/final/feedback.jsonl` | Platform + object type + source object ID | One eligible source text, regardless of how many models/tasks/aspects it mentions. Kept locally. |
| [data/final/tasks.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/main/data/final/tasks.json) | `tasks[].id` | Definitions and explicit benchmark mappings. Unsupported tasks do not gain invented benchmark evidence. |
| [data/final/view_data.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/main/data/final/view_data.json) | Shared family/model/task IDs | Small aggregates and capped, redacted excerpts for the browser. |

Null numeric values mean unknown/unavailable. Unknown release dates, license terms, model ancestry, evaluation settings and task labels are preserved. The repository table distinguishes `created_at`, `last_modified` and an unverified `release_date`; only canonical records with explicit official evidence enter the verified-release timeline. `parameters_stored` is a count of stored tensors, potentially only adapter tensors, and is not a verified total/active parameter count.

Repository type and family inference carry evidence and uncertainty. `original_release` denotes distribution under a known publisher namespace; it does not certify a new architecture. Multiple derivative flags are preserved where detectable. A bounded popularity/recentness sample of currently visible repositories cannot reconstruct the complete historical HF population.

Family inference uses the model's own repository name first, then explicit base-model names, then bare architecture tags. Publisher names and namespaced dataset tags cannot assign a family; conflicting base-family evidence remains unknown. Explicit test/random-weight repositories, known text-only Gemma variants, and metadata-identified CLIP classifiers are excluded. The broader captioning/VQA queries additionally require a recognized generative VLM family. These rules support relevance screening, not individual model auditing.

GGUF containers and MLX conversions receive `format_conversion`; neither establishes lower-bit quantization. Quantization requires an explicit method/bit-width signal or an uncontradicted explicit quantized base relation. Full-precision or unquantized names conflicting with that relation retain `quantization_metadata_conflict` rather than a confirmed quantization label. A repository may carry both format-conversion and fine-tuning/quantization flags.

## Rebuild from the local frozen evidence

Python 3.10+ is sufficient for offline processing. Run from the repository root:

```bash
python3 scripts/collect_repositories.py --process
python3 scripts/build_final_models.py
python3 scripts/process_feedback.py
python3 scripts/build_final_views.py
python3 scripts/validate_final_data.py
python3 scripts/build_static_site.py
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/verify_offline_rebuild.py
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/final.html`. For the public bundle alone, serve `dist/`.

The first three commands require the corresponding local `data/raw/` caches. A fresh Git clone contains the prepared public outputs but intentionally does not contain full feedback text or raw community responses. To recompute view data from all feedback, first obtain the local research handoff or recollect the sources below. Never claim an offline raw-data rebuild succeeded from a clone missing those inputs.

## Recollect from official sources

Install the pinned HF client in a dedicated virtual environment; GitHub CLI (`gh`) and system `curl` must also be available. GitHub collection uses the CLI's existing authentication. Tokens must not be pasted into scripts, logs or tracked configuration.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-data.txt
python3 scripts/collect_repositories.py --pilot
python3 scripts/collect_repositories.py --collect
python3 scripts/build_final_models.py --fetch
.venv/bin/python scripts/collect_feedback.py --platform github --workers 2 --report-name feedback_github_collection
.venv/bin/python scripts/collect_feedback.py --platform huggingface --workers 1 --report-name feedback_huggingface_collection
python3 scripts/process_feedback.py
python3 scripts/build_final_views.py
python3 scripts/validate_final_data.py
```

Model metadata collection uses `curl` with normal certificate verification because one local Python installation lacked a configured certificate store. It does not disable TLS verification. The collectors cache pages/objects and apply bounded retries; permissions and source-specific API limits still apply. Preserve acquisition reports, retrieval timestamps, source URLs, raw-file paths and hashes. On future runs use a new dated raw snapshot if a genuinely new collection is desired; cached runs are resumptions, not new observations.

Sources and official interface documentation: [HF model search](https://huggingface.co/docs/huggingface_hub/en/guides/search), [HF discussions](https://huggingface.co/docs/huggingface_hub/en/guides/community), [HF model cards](https://huggingface.co/docs/hub/model-cards), [HF rate limits](https://huggingface.co/docs/hub/rate-limits), [GitHub issues](https://docs.github.com/en/rest/issues/issues), [GitHub issue comments](https://docs.github.com/en/rest/issues/comments), [GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).

The configured feedback acquisition in this implementation uses official-model GitHub issues/comments and HF discussion comment events. GitHub Discussions and Reddit are optional extensions, not claimed as collected sources. Research access to Reddit must follow its [current access policy](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data).

## Quality gates and interpretation

The two 10,000-record targets are checked independently. Reports reconcile raw observations, duplicate removals, exclusions and accepted records. Structural validation checks source fields, IDs, foreign keys, finite scores and equality between browser aggregates and full tables. It does not establish classification accuracy.

The labels are transparent rule baselines. Their empirical accuracy has not been measured, and structural checks do not establish label accuracy. Model association from a repository is context, not proof that the author tested that exact model. Family-only observations never become evidence for all individual variants.

Task-relevant, exact-model-attributable, family-only, actual-experience and unclassified totals are reported separately. Aspect polarity retains mixed observations; neither positive-word totals nor downloads/likes are satisfaction ratings. Platform populations and issue-reporting behavior are strongly selected samples, so model rankings or population satisfaction claims require additional validation.

For benchmarks, raw values, versions, splits, units, source types and comparison groups are preserved. Fixed scale ranges avoid filter-dependent min–max normalization. Source-table comparisons retain disclosed limitations: a common table is not a reproduced controlled evaluation. Missing values remain gaps. Consult [model_radar_coverage.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/main/reports/model_radar_coverage.json) and the source links before comparing models.

## Publication boundary

Full raw material and complete feedback text stay in the local research handoff. [.gitignore](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/main/.gitignore) excludes raw caches, the full feedback table, private worksheets and credentials. The static builder uses an explicit allowlist, and the Pages workflow uploads only `dist/`. It does not publish `data/raw/`, complete feedback, private worksheets, or unrelated files.

The preview contains limited, redacted source excerpts to support traceability; counts use the complete accepted corpus, while the excerpt set is not representative. Public reuse remains subject to source terms. A repository's software license does not automatically license every community comment. Document retrieval instructions and publish the least text needed for the evidence view.

Detailed reports remain in [reports/](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/tree/shilin/reports), with dedicated model and feedback methodology documents in [docs/](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/tree/shilin/docs).
