# Pixels to Intelligence · MLLM Evidence Atlas

STATS 401 · Group 7 · **Sean Wan, Yuxuan Huang, Shilin Ou**

**[Open the final website](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/)** · [Website audit](docs/final-website-audit.md) · [Review and revisions](docs/user-review.md) · [Rollback](docs/redesign-and-rollback.md)

## User task

Help researchers and developers choose an image-and-text task, shortlist two open-weight models under their constraints, and compare measured capabilities, reported practical concerns and evidence gaps before testing locally.

Five coordinated interactive views support this workflow:

1. **Ecosystem growth:** a brighter, smooth cumulative stacked area starts at the first observed date in the selected dataset. A temporal brush and category baseline reordering support exploration; repository creations and verified canonical releases remain distinct.
2. **Community concerns:** a prominent full-width phrase cloud uses stronger size differences. Select a concern to inspect counts and source excerpts or continue to a linked task; detailed counts and methods stay available on demand.
3. **Model-family story:** the same 57 model dots move between release dates, hierarchical family groups and within-source performance distributions. Performance controls appear only in that stage; model cards show explicit A/B selection status.
4. **Two-model radar:** six measured user concerns map to benchmark proxies, with an optional eight-benchmark detail profile. Comparison pairs must share at least four valid measured dimensions; 47 models have a qualifying partner. Speed and memory are disclosed as unmeasured outside the polygon. Sources and raw scores remain inspectable.
5. **Task-to-model shortlist:** a task-specific score–size scatterplot uses logarithmic parameter position and an empirical Pareto frontier to reveal tradeoffs. Parameter/license filters, source-linked candidate evidence and A/B selection lead back to the radar and a downloadable evidence brief.

There is no opaque overall model ranking. A missing value is not zero; mention frequency is not satisfaction or model performance. All 57 models remain available in the family story even when their benchmark coverage is insufficient for radar selection. Pinned comparison models outside current metadata filters are flagged, including in the exported brief; the size–score frontier is not a measure of hardware efficiency.

## Run locally

```bash
git clone https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis.git
cd stats401-fp-7-mllm-evo-vis
python3 -m http.server 8765 --bind 127.0.0.1
```

Open **http://127.0.0.1:8765/**. Prepared browser data and D3 7.9.0 are included; the redesigned charts do not need a CDN. External evidence links require internet access. `final.html` redirects to the main explorer, retaining its fragment.

## Data snapshot and counting rules

Collection snapshot: **17 October 2026**. The concern-led website revision is dated 18 October. These units must not be added together.

| Layer | Count | Meaning |
| --- | ---: | --- |
| HF repository records | 18,255 | Distinct retained repositories; original distributions, fine-tunes, adapters and quantizations remain distinct categories |
| Canonical comparison models | 57 in 10 families | Smaller source-checked set, including 49 verified release dates |
| Benchmark measurements | 143,086 | 142,843 baseline numeric values plus 243 official-source values; these are not distinct models |
| Community records | 21,674 | Unique retained issue bodies/comments from GitHub and Hugging Face, not unique people or independent product reviews |
| Task-labeled feedback | 1,965 | Rule-supported subset across eight task categories |
| Exact-model-associated feedback | 1,507 | Repository association does not prove that a specific variant was tested |
| Concern-labeled feedback | 15,798 | At least one of 15 overlapping concern categories |

Labels are rule-generated, not human-validated. The corpus overrepresents support forums. Family evidence is never silently assigned to every variant. Metadata classification and benchmark comparability remain imperfect.

## Files and reproducibility

| File | Purpose |
| --- | --- |
| [Repository JSONL](data/final/repositories.jsonl) | Full retained repository metadata |
| [Canonical model registry](data/final/models.json) | Models, metadata and benchmark definitions |
| [Benchmark table](data/final/benchmark_results.csv.gz) | All measurements with provenance |
| [Feedback JSONL gzip](data/final/feedback.jsonl.gz) | Full cleaned public feedback corpus |
| [Task definitions](data/final/tasks.json) | Task labels and benchmark mappings |
| [Model relationships](data/final/model_relationships.csv) | Sourced typed relationships |
| [Explorer payload](data/final/explorer_data.json) | Compact aggregates and capped, shortened public excerpts |
| [Raw-cache archive](data/archives/raw-cache-2026-10-17.tar.gz) | Preserved source cache for offline reconstruction |
| [Publication manifest](reports/public_data_manifest.json) | Checksums and credential-redaction details |
| [Data dictionary](docs/data-dictionary.md) | Field definitions and joins |
| [Acquisition/processing methods](docs/data-pipeline.md) | Collection, cleaning and exclusions |
| [Concern aggregation audit](reports/explorer_data_audit.json) | Counts, source hash and interpretation limits |

Source terms still apply; public availability does not create blanket redistribution permission. Published excerpts remove code/quoted material and contact/credential patterns, retain source links, and are capped. The Pages bundle excludes raw caches and full feedback text. Some first-collection full API responses were not preserved; normalized records, provenance ledgers and successful backfills are documented in the inherited reports.

```bash
make test                          # Python regression suite
make syntax                        # JS syntax
node --test tests/explorer.test.mjs # Evidence-operation and payload checks
python3 scripts/build_explorer_data.py # Rebuild concern payload from published gzip
make site                          # Build allowlisted dist/
```

For original table reconstruction in a **fresh clone**, use `make restore`, then `make rebuild`; see [detailed instructions](docs/quickstart.md). Rebuild the explorer payload afterward. Do not restore over different original research caches. The older handoff documents describe the original data delivery; this README and the website audit describe the final integrated site.

## Review, design and release

Sean completed a qualitative review of the **old** handoff site, then confirmed that task selection → A/B assignment → radar updates and all three Families stages worked on the **first published redesign**. He subsequently provided screenshot-based feedback about clutter, excessive text, unclear selection and weak comparison views. The latest clarity revision responds with simpler controls, stronger chart hierarchy and a more direct concern → task → candidate → comparison loop. [The reviews, production check and revision responses](docs/user-review.md) are recorded separately. The earlier workflow confirmation does not constitute a user test of this latest revision; no new human test result is claimed. All feedback is from the same project-member reviewer, not an independent user study or validation of feedback labels. No fabricated participants, timings, agreement or completion rates are reported.

Design references: [The Pudding — Is the Love Song Dying?](https://pudding.cool/2024/11/love-songs/) for persistent marks and staged regrouping; [Dancing Histograms](https://www.meandeviation.com/dancing-histograms/) for common-baseline category comparison. Class connections and What–Why–How are on the website. Our SVG layout and interactions are custom; D3 is [BSD-licensed](vendor/D3-LICENSE).

Pushes to `main` run validation and deploy the public-only bundle using GitHub Actions. Preserve both fallback pages: [interim](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/interim.html) and [handoff](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/handoff.html). The tag `pre-final-redesign-2026-10-18` preserves the complete pre-redesign repository state.

The final report, poster and presentation are separate submission deliverables; this website release does not assert that those are complete.
