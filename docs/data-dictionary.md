# Data dictionary and join guide

[Repository home](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/README.md) · [Quick start](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/quickstart.md) · [Methodology](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/data-pipeline.md)

## File contract

Paths in this table are relative to the repository root. Every file link targets the shared `shilin` branch.

| Table | Format / record unit | Primary key | Main use |
| --- | --- | --- | --- |
| [repositories.jsonl](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/repositories.jsonl) | JSONL; one retained HF repository | `id`; exact `repo_id` alias | Ecosystem growth and derivatives |
| [models.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/models.json) | JSON object; canonical rows in `models` | `models[].id` | Selected exact variants, metadata and crosswalks |
| [benchmark_results.csv.gz](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/benchmark_results.csv.gz) | Gzip CSV; one reported measurement | `result_id` | Scores with protocol and provenance |
| [feedback.jsonl.gz](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/feedback.jsonl.gz) | Gzip JSONL; one retained source body/comment | `id` | Community tasks and practical observations |
| [tasks.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/tasks.json) | JSON object; definitions in `tasks` | `tasks[].id` | Task labels and benchmark mappings |
| [model_relationships.csv](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/model_relationships.csv) | CSV; one typed, sourced edge | Source/target/type/evidence combination | Chronology and documented relationships |
| [view_data.json](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/view_data.json) | Prepared JSON object | Shared model/task/family IDs | Lightweight frontend input |

`models.json` also contains `baseline_models`, `metrics`, and provenance. Its top level is **not** a model array. The original 285 OpenVLM entries remain registered separately from the 57 selected models.

## Important fields

| Layer | Fields | Interpretation |
| --- | --- | --- |
| Repositories | `repo_id`, `family_id`, `repo_type`, `derivative_flags` | Repository identity and inferred family/type; flags can overlap |
| Repositories | `created_at`, `last_modified`, `retrieved_at` | Repository activity and collection times, not verified model releases |
| Repositories | `parameters_stored`, `parameters_scope` | Stored tensors; may describe an adapter rather than a full model |
| Models | `repo_ids`, `family_id`, `open_weight`, `license`, `gated` | Exact aliases, family, weight availability and usage conditions |
| Models | `release_date`, `release_month`, `release_status`, `release_evidence_url` | Day/month/unknown precision and official evidence |
| Models | `parameters_total_b`, `parameters_active_b`, source fields | Parameter metadata with explicit scope and missingness |
| Benchmarks | `canonical_model_id`, `model_id`, `is_canonical` | Canonical join or registered baseline-only identity |
| Benchmarks | `benchmark_id`, `benchmark_version`, `split`, `metric`, `unit`, `setting_id` | Measurement definition; do not collapse incompatible protocols |
| Benchmarks | `score`, `comparability_group`, `comparability_status` | Raw value and declared comparison context |
| Benchmarks | `is_primary_metric`, `visualization_eligible` | Select supported top-level dimensions for the explorer |
| Feedback | `platform`, `source_object_id`, `thread_id`, `source_url`, timestamps | Traceability to an actual issue body or comment |
| Feedback | `model_ids`, `model_repo_ids`, `family_id`, `attribution_level` | Exact canonical, exact repository or family association |
| Feedback | `task_ids`, `task_candidates`, `reasoning_term_resolution` | Rule-assigned tasks and preserved ambiguity |
| Feedback | `aspects`, `sentiment`, `experience_type`, `evaluative_status` | Practical observations and separate evaluation status |
| Tasks | `benchmark_ids`, `mapping_rationale`, `inclusion_rules` | Explicit mapping and matching terms; some tasks have no direct benchmark |
| Relationships | `source_model_id`, `target_model_id`, `relationship_type`, evidence fields | Sourced endpoints; release order is not weight inheritance |

Numeric JSON nulls mean unknown or unavailable. CSV cells are strings: parse numeric scores explicitly and check missing cells first. Boolean CSV flags use textual values such as `true`/`false`; do not treat a nonempty `false` string as truthy. Unknown dates, units, settings and categories must remain visible.

## Supported joins

```text
models.models[].id  <--> benchmark_results.canonical_model_id
models.models[].id  <--> feedback.model_ids[]
models.models[].id  <--> relationships.source_model_id / target_model_id
tasks.tasks[].id    <--> feedback.task_ids[]
tasks.benchmark_ids <--> benchmark_results.benchmark_id
family_id          <--> family-level summaries across layers
```

Baseline-only benchmark rows can have no canonical ID; `model_id` remains registered in `baseline_models`. Do not fuzzy-match model names to fill missing IDs. A `family_id` join supports family summaries; it does not turn a family-only comment into evidence for every family member.

## Example: count task evidence for exact canonical models

This streams the published feedback gzip without restoring raw caches:

```python
from collections import defaultdict
import gzip
import json

support = defaultdict(set)
with gzip.open("data/final/feedback.jsonl.gz", "rt", encoding="utf-8") as stream:
    for line in stream:
        if not line.strip():
            continue
        record = json.loads(line)
        if record["attribution_level"] != "model":
            continue
        for model_id in set(record["model_ids"]):
            for task_id in set(record["task_ids"]):
                support[(model_id, task_id)].add(record["id"])

counts = {key: len(ids) for key, ids in support.items()}
print("Model/task combinations with evidence:", len(counts))
```

Each pair counts distinct feedback IDs. Overall feedback totals must also deduplicate IDs; multi-task or multi-model pair totals are not additive. Thread follow-ups are separate objects but not independent experimental participants.

## Benchmark and visualization rules

For the selected-model comparison layer, filter to canonical, primary and visualization-eligible rows before joining. Then require compatible versions, splits, metrics, units and protocol groups. A common source table does not establish a reproduced controlled evaluation; inspect `comparability_status` and the source.

The explorer uses fixed axis bounds: OCRBench v1 uses 0–1,000 points; the selected percentage-style dimensions use 0–100. Missing, conflicting, unmatched or out-of-range results remain gaps. Do not choose the maximum reported score just to fill an axis.

The browser payload is a convenience layer. Counts cover the full retained corpus, while excerpts are capped and are not a representative sample. The [view contract](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/final-view-contract.md) documents filters, B/E/C evidence cells, limits and interactions.

## Evidence and publication

The [publication manifest](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/public_data_manifest.json) records archive/member SHA-256 values and credential redactions. Original acquisition hashes and published-copy hashes differ where strings were masked. The [raw archive notes](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/feedback_raw_provenance.json) distinguish initial normalized feedback caches from representative later API-response snapshots.

Feedback originals and multilingual matching terms retain their source language. Project documentation is English except for the designated [Chinese delivery report](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/delivery-zh.md). Labels are rule-generated and their empirical accuracy has not been measured. Platform feedback and engagement statistics are selected evidence, not population satisfaction estimates.
