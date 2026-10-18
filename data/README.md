# Data index

[Grader's View](../README.md) · [Data dictionary](../docs/data-dictionary.md) · [Methods](../docs/data-pipeline.md)

## Source evidence

- [OpenVLM.json](OpenVLM.json): downloaded benchmark baseline, preserved as supplied.
- [raw-cache-2026-10-17.tar.gz](archives/raw-cache-2026-10-17.tar.gz): published source caches for offline reconstruction.
- [Archive notes](archives/README.md) and [publication manifest](../reports/public_data_manifest.json): coverage, file hashes, credential redactions and original/public distinctions.

Not every initial API response was preserved. The archive contains normalized evidence and documented later API snapshots; do not describe it as a complete original-response archive.

## Processed tables

| File | Unit / purpose |
| --- | --- |
| [repositories.jsonl](final/repositories.jsonl) | 18,255 distinct retained HF repository records |
| [feedback.jsonl.gz](final/feedback.jsonl.gz) | 21,674 distinct retained community records, with derived labels |
| [models.json](final/models.json) | 57 curated canonical models and metadata |
| [benchmark_results.csv.gz](final/benchmark_results.csv.gz) | 143,086 numeric measurements and provenance |
| [tasks.json](final/tasks.json) | Eight task definitions and benchmark mappings |
| [model_relationships.csv](final/model_relationships.csv) | Sourced relationship types |
| [explorer_data.json](final/explorer_data.json) | Current browser aggregates and shortened excerpts |
| [view_data.json](final/view_data.json) | Earlier view payload, retained for compatibility |

Gzip files can be read directly with Python's `gzip` module. `interim_models.json` and `comments_example.jsonl` belong to the older prototype, not the final collection. Their records must not be added to final counts.

Use `make restore` in a fresh clone before rebuilding. Do not overwrite different local research caches. [Quick start](../docs/quickstart.md) explains the complete workflow.
