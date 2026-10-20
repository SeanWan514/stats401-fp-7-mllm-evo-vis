# Working on the project

[README](README.md) · [Quick start](docs/quickstart.md) · [Methods](docs/README.md)

## Edit the source, not generated outputs

| Change | Source |
| --- | --- |
| Website content / navigation | `index.html`, `assets/js/slides.js`, `assets/css/slides.css` |
| Charts, evidence dialogs and interaction | `assets/js/explorer.js`, `assets/js/explorer-core.mjs`, `assets/css/` |
| Canonical metadata / acquisition scope | `config/`, `scripts/collect_repositories.py`, `scripts/build_final_models.py` |
| Feedback collection / rule labels | `scripts/collect_feedback.py`, `scripts/process_feedback.py` |
| Browser aggregation | `scripts/build_final_views.py`, `scripts/build_explorer_data.py` |
| Final documents | User-approved PDFs in `deliverables/`; update their checksums together |
| Build/deploy | `scripts/build_static_site.py`, `.github/workflows/` |

The current browser loads `data/final/explorer_data.json`. Never substitute a missing score with zero or infer variant-level evidence from family-only comments. Keep raw acquisition evidence and multilingual matching fixtures intact.

## Verify a change

```bash
make check
make serve
```

Check all five views, chart/model selection, source dialogs, empty/missing states, keyboard controls and a narrow viewport. After data/rule changes, use a spare copy with complete caches to run `make rebuild` and `make reproducibility`.

Keep data records, source provenance and third-party terms intact. Never commit API credentials, local caches, temporary renders or generated `dist/`. The build uses an explicit allowlist to prevent full feedback/raw archives from entering Pages. Don't edit archived frozen files to satisfy current-feature tests.

## Release and recovery

The canonical repository is `SeanWan514/stats401-fp-7-mllm-evo-vis`, branch `main`. A push runs validation and publishes `dist/` to the project's GitHub Pages site; no second website repository is required. Confirm CI and compare live assets with `python3 scripts/verify_deployed_site.py` after deployment.

Git history and recovery tags preserve previous versions. [Archive notes](archive/README.md) and the [cleanup log](docs/repository-cleanup.md) explain non-destructive recovery. Make explicit, scoped commits; leave unrelated or untracked teammate work untouched.
