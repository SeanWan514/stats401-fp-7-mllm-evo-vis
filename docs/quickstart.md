# Run, inspect and reproduce

[Grader's View](../README.md) · [Live website](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/) · [Data dictionary](data-dictionary.md)

## 1. Preview the prepared project

Requirements: Python 3.10+ and `make`. Preview does not require model weights, API keys or Python packages. The browser uses bundled D3, modules and prepared JSON.

```bash
git clone https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis.git
cd stats401-fp-7-mllm-evo-vis
make serve
```

Open **http://127.0.0.1:8765/**. Use `make serve PORT=8766` if needed. The target builds and serves `dist/`, including final PDFs and historical website URLs. Do not double-click HTML (`file://` cannot reliably load modules/data).

Without `make`:

```bash
python3 scripts/build_static_site.py
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

The root `index.html` is the current source. `archive/website/` contains frozen assets; the build restores their original root URLs. Do not edit `dist/` directly.

## 2. Read prepared tables

The standard library reads the compressed tables directly. From the repository root:

```python
import csv, gzip, json
from pathlib import Path
folder = Path('data/final')
print('Models:', len(json.loads((folder / 'models.json').read_text())['models']))
with gzip.open(folder / 'feedback.jsonl.gz', 'rt', encoding='utf-8') as stream:
    print('Feedback records:', sum(1 for line in stream if line.strip()))
with gzip.open(folder / 'benchmark_results.csv.gz', 'rt', newline='', encoding='utf-8') as stream:
    print('Measurements:', sum(1 for row in csv.DictReader(stream)))
```

Expected: **57 models, 21,674 feedback records, 143,086 measurements**. The separate repository JSONL has 18,255 records. Iterate JSONL by physical newline, not every Unicode line separator. See the [data index](../data/README.md).

## 3. Reconstruct data offline

Use a **fresh clone or spare copy**. Reconstruction modifies generated tables and reports. It uses Python's standard library; online recollection has separate dependencies and access requirements.

```bash
make restore
make rebuild
make reproducibility
```

`restore_public_data.py` verifies the published manifest, restores 1,861 raw-cache files and full feedback, and refuses to overwrite different originals. If complete original research caches already exist, skip restore. Inspect a separate destination with `python3 scripts/restore_public_data.py --destination /path/to/empty-folder`; processing still uses the repository's own `data/raw/`.

`make rebuild` runs repository/model/feedback processing, creates the earlier view payload, validates tables and builds the current concern-led explorer payload. Raw caches and full feedback are not part of the public Pages bundle.

A first rebuild from public caches may change input/content hashes because credential-like text was redacted for publication. The subsequent reproducibility check compares repeated core-table builds, not against unredacted originals. It does not itself certify every browser artifact; regression tests check the prepared payload separately. See [pipeline details](data-pipeline.md) and [public reconstruction evidence](../reports/public_reconstruction.json).

## 4. Test and build

Node 20+ is recommended for the JavaScript checks.

```bash
make check
make site
```

`make check` runs Python regression tests, JavaScript syntax checks and all Node test suites, including submission-link/PDF/build checks. `make site` recreates the explicit allowlisted `dist/` bundle. Both CI workflows run verification before deployment.

To verify the copied PDFs independently:

```bash
cd deliverables
shasum -a 256 -c checksums.sha256
```

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Charts or modules cannot load | Serve `dist/` over HTTP; inspect browser errors |
| An old-version link fails when serving the source root | Use `make serve`; historical routes are restored by the build |
| Raw caches are missing | Run `make restore` in a fresh clone before rebuilding |
| Restore refuses a different local file | Keep the original; use a separate clone, not a forced overwrite |
| Validator needs uncompressed feedback/benchmark files | Restore, then rebuild; prepared gzip tables remain directly readable |
| First public rebuild changes hashes | Read the documented redaction distinction, then compare a repeated build |

Online recollection is optional and separate. See [source configuration](../config/), [script index](../scripts/README.md) and [acquisition methods](data-pipeline.md). Do not commit credentials or silently replace the documented snapshot.
