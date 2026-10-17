# Report index

[Repository home](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/README.md) · [Data dictionary](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/data-dictionary.md)

## Start here

| Report | Use |
| --- | --- |
| [English delivery report](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/delivery.md) | Delivered scope, downstream uses, data downloads and remaining evidence limits |
| [Chinese delivery report](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/delivery-zh.md) | The single Chinese project document |
| [Repository counts](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/repository_counts.json) | Repository funnel, family/type composition and missing metadata |
| [Feedback quality](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/feedback_quality.json) | Unique objects, exclusions, platform/task/attribution distributions |
| [Model quality](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/model_data_quality.json) | Canonical coverage, dates, baseline preservation and unavailable sources |
| [Radar coverage](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/model_radar_coverage.json) | Default pair, approved per-axis source groups and missing dimensions |

## Reproduction and publication evidence

| Report | What it establishes |
| --- | --- |
| [Final structural validation](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/final_validation.json) | Actual-table keys, joins, provenance, finite scores and browser count reconciliation |
| [Model validation](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/model_validation.json) | Preservation of original numeric values and compressed-table equality |
| [Offline reproducibility](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/reproducibility.json) | Repeated local reconstruction and artifact hashes |
| [Public-data manifest](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/public_data_manifest.json) | Published archives, all raw-file hashes, original/public distinctions and redactions |
| [Public reconstruction](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/public_reconstruction.json) | Independent reconstruction from the published archives and feedback-byte equality |
| [Teammate workflow validation](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/teammate_workflow_validation.json) | Clean-copy restore, rebuild, repeated-build check, static build and missing-cache guard |
| [Raw-response provenance](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/feedback_raw_provenance.json) | Exact coverage of later API-response archives and initial normalized caches |

Integrity and regression checks do not measure label accuracy or establish scientific comparability. A public-copy rebuild may have different hashes from the original local snapshot; first rebuild once, then test repeated-build equality.

## Detailed acquisition and audit records

Files named `*collection*`, `*fetch*`, `*retry*`, `*backfill*`, and `*source_manifest*` record source acquisition. Exclusion reports retain reasons and source IDs. `*pilot*` reports are historical small-sample checkpoints; their counts must not replace the final counts above. `repository_review_sample.json` is a deterministic inspection sample, not a statistical census or proof of classification accuracy.

Processing scripts can overwrite generated reports. Keep the release commit and publication manifest when referring to a fixed snapshot. Use distinct feedback IDs, repository IDs and benchmark result IDs according to the [data dictionary](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/data-dictionary.md).
