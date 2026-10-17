# Complete public research data

These archives belong to the shared group repository's `shilin` branch.

- [All 21,674 retained feedback records](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/feedback.jsonl.gz) (`feedback.jsonl.gz`).
- [All 1,861 raw-cache files](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/archives/raw-cache-2026-10-17.tar.gz) (`raw-cache-2026-10-17.tar.gz`).
- [Manifest, original/public SHA-256 values and credential-redaction counts](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/public_data_manifest.json).
- [Restore helper](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/restore_public_data.py) and [pipeline instructions](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/data-pipeline.md).

From a fresh clone:

```bash
python3 scripts/restore_public_data.py
```

This validates the archives and every raw-file hash, then restores `data/raw/` and `data/final/feedback.jsonl`. The script refuses to overwrite different local originals; use `--destination` with an empty directory for a separate copy. Run the pipeline processing commands once before the byte-identical-repeatability check.

Public copies mask credential-like strings only; all source objects and cache files remain included. Local originals are unchanged. Original acquisition hashes and published hashes differ for redacted files and are both documented in the manifest. This archive includes initial normalized feedback caches plus representative later API-response snapshots; it is not a reconstruction of every first-fetch response. Third-party source terms and attributions still apply, with no blanket relicensing.
