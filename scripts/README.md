# Script index

[Repository home](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/README.md) · [Quick start](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/quickstart.md) · [Data dictionary](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/data-dictionary.md)

Run commands from the repository root. Offline commands require only Python 3.10+; online commands have the additional dependencies in the [pipeline guide](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/data-pipeline.md). No script downloads model weights or executes model repository code.

| Stage | Script | Inputs / purpose | Network |
| --- | --- | --- | --- |
| Restore | [restore_public_data.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/restore_public_data.py) | Verify published archives; restore caches and full feedback without overwriting different originals | No |
| Repository processing | [collect_repositories.py --process](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/collect_repositories.py) | Frozen HF metadata pages → unique screened repository table | No |
| Model processing | [build_final_models.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/build_final_models.py) | Canonical manifest + baseline + cached official evidence → models, scores and relationships | No |
| Feedback processing | [process_feedback.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/process_feedback.py) | Normalized cached source objects → filtered feedback, task definitions and quality reports | No |
| View preparation | [build_final_views.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/build_final_views.py) | Final tables → lightweight browser payload | No |
| Data checks | [validate_final_data.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/validate_final_data.py) | Validate IDs, joins, provenance, scores and browser/full-table counts | No |
| Repeated-build check | [verify_offline_rebuild.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/verify_offline_rebuild.py) | Rebuild after an initial complete build and compare eight output files | No |
| Static build | [build_static_site.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/build_static_site.py) | Explicit public-file allowlist → `dist/` | No |
| Public packaging | [package_public_data.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/package_public_data.py) | Complete local caches → credential-masked gzip downloads and manifest | No |
| HF acquisition | [collect_repositories.py --pilot / --collect](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/collect_repositories.py) | Official public HF metadata API | Yes |
| Model evidence acquisition | [build_final_models.py --fetch](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/build_final_models.py) | Official model metadata, cards and release evidence | Yes |
| Community acquisition | [collect_feedback.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/collect_feedback.py) | Configured GitHub issue/comment APIs and HF discussion events | Yes |

## Processing order

```text
restore archives (fresh clone only)
    -> repository/model/feedback processing
    -> build_final_views.py
    -> validate_final_data.py
    -> build_static_site.py
```

`make rebuild` runs the processors in order. `make test` runs the repository/view/publication fixtures and the separate feedback regression suite. Packaging is an intentional dataset-release step, not necessary for preview or analysis; it replaces published artifacts and manifest hashes and should be reviewed before committing.

## Preserved interim utilities

[build_interim_data.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/build_interim_data.py), [discover_hf_models.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/discover_hf_models.py), and [score_comments.py](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/score_comments.py) belong to the earlier prototype. They are not the final-data rebuild entry point. The old comment-scoring placeholder does not generate the published feedback layer.
