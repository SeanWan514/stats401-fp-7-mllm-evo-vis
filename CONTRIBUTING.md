# Working with the handoff

[Repository home](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/README.md) · [Quick start](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/quickstart.md) · [Script index](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/scripts/README.md)

## Pick the source to edit

| Change | Edit | Then run |
| --- | --- | --- |
| Layout or interactions | `final.html`, `final.css`, `final.js` | Preview locally; `make test`; `node --check final.js`; `make site` |
| Canonical models or official evidence | `config/canonical_models.json` and the model methodology | Acquire/cache explicit sources, then `make rebuild` |
| Feedback sources | `config/feedback_sources.json` | Follow the online collection guide, then rebuild |
| Task or aspect rules | `scripts/process_feedback.py` | Update meaningful regression cases, then rebuild |
| Browser aggregation | `scripts/build_final_views.py` and the view contract | `make test`, rebuild view data, validate and preview |
| Documentation | README or the relevant guide | Check commands, counts and GitHub links; `make site` |

Use Python 3.10+ for data processing. Browser data comes from `data/final/view_data.json`; do not add a browser dependency on full raw caches. Preserve source text and multilingual matching fixtures in their original language. All authored documentation is English except `reports/delivery-zh.md`.

## Check a change

```bash
make test
node --check final.js
```

After data or rule changes, use complete caches:

```bash
make rebuild
make reproducibility
make site
```

Before a release, exercise task selection, model selection, sources, missing scores and an empty candidate filter. Check a narrow viewport. Counts and provenance must remain consistent with the full tables. Generated outputs should be explained by source/configuration changes; do not hand-edit a score to complete a radar dimension.

## Preserve data provenance

Keep dated original caches and configuration before recollection. Successful immutable caches are resumptions, not a new time snapshot. Public packaging masks credential-like strings and retains original/public hashes; do not commit unredacted credentials or silently replace a source snapshot. Packaging should retain every intended source object and cache file. Original third-party terms still apply.

## Shared branch and published website

This shared repository's `shilin` branch contains the processing source, full public archives and handoff documentation. Its validation workflow runs lightweight regression, syntax and static-build checks. The original Pages workflow still targets `main`; pushing `shilin` does not replace the group's interim homepage.

The final explorer is published from [Owen-1234/mllm-evidence-explorer](https://github.com/Owen-1234/mllm-evidence-explorer). To update that website:

1. Build and inspect `dist/` from the shared source branch.
2. Sync prepared static files into the website repository's `site/` directory. Keep the final explorer as `site/index.html` and retain the old interim page as `site/interim.html`.
3. Check relative asset paths and the homepage's interim link before committing.
4. Push the website repository's `main` branch and confirm its Pages deployment succeeds.

These are separate releases. Data archives remain in the shared group branch and are linked from the website; they do not need to be duplicated into the website bundle.
