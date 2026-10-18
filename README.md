# MLLMs: Which Model for Your Task?

STATS 401 · Group 7 · **Sean Wan, Yuxuan Huang, Shilin Ou**

**[Open the final website](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/)** · [Website audit](docs/final-website-audit.md) · [Review and revisions](docs/user-review.md) · [Rollback](docs/redesign-and-rollback.md)

## User task

Help researchers and developers understand the open-weight MLLM ecosystem, identify user concerns, compare two models' measured capabilities, and find task-specific candidates within a parameter-size range before testing locally.

The website presents **14 pages**, navigated with the top progress bar, edge arrows or keyboard. The sequence is cover → framing → mission → context → goals → data → five visualization pages → conclusions → methods → closing. Existing chart deep links such as `#growth` and `#matrix` open their corresponding pages. On narrow screens, long content scrolls within the current page without mixing it with another page.

Five interactive views support the narrative:

1. **Ecosystem growth:** bright, smooth cumulative areas show repository growth from January 2023, retaining earlier records in the cumulative baseline. Category baseline reordering and month inspection support comparison; repository creations and verified canonical releases remain distinct.
2. **Community concerns:** a full-width phrase cloud emphasizes mention-frequency differences. Select a concern to open source excerpts and task links; exact counts and the feedback collection method open in a separate dialog.
3. **Model-family story:** the same 57 model dots move between release dates, hierarchical family groups and within-source performance distributions. Search highlights models in every stage; selecting a dot opens metadata and sources. Benchmark/source controls appear only in Performance. This view has no A/B controls.
4. **Standalone two-model radar:** six measured user concerns map to benchmark proxies, with an optional eight-benchmark detail profile. Comparison pairs must share at least four valid measured dimensions; 47 models have a qualifying partner. A/B selection belongs only to this view. Speed and memory remain unmeasured; raw scores and source settings open in dialogs.
5. **Task-to-model rankings:** five supported tasks lead to benchmark rankings within four parameter-size tiers. Each model occupies its own row; up to three leading measured candidates per tier share a common score scale. Select a model for source evidence, or inspect all eligible candidates and evidence gaps. This view does not assign A/B models or export a brief.

There is no opaque overall model ranking. Task ranks describe one selected benchmark/source group, not universal model quality. Parameter tiers are size categories, not measured hardware requirements. A missing value is not zero; mention frequency is not satisfaction or performance. All 57 models remain in the family story, and the dataset retains all eight task categories even though only five support scored, known-size task comparisons.

Reading guides and detailed evidence for all five views use centered native dialogs with a backdrop, close button, Escape and outside-click dismissal. Controls stay with the view they affect. Page changes preserve chart selections; View 5 initially opens on **Visual question answering**. The five chart interiors and original evidence dialogs are unchanged by the page-layout revision. Publication and verification status are recorded in the [website audit](docs/final-website-audit.md); earlier release checks remain version-specific.

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

Sean completed a qualitative review of the **old** handoff site, then confirmed two workflows on the **first published redesign**. Subsequent reviews identified clutter, unclear controls and weak comparison views. His latest requested changes remove the global exploration bar, move reading guides/evidence into centered dialogs, confine A/B selection to the radar, and replace overlapping task-map marks with separate ranked model rows. [The reviews, production check and revision responses](docs/user-review.md) are recorded separately. The earlier workflow confirmation is not a human test of this modal-focused revision; current technical checks are recorded in the website audit. All feedback is from the same project-member reviewer, not an independent user study or validation of feedback labels. No new human-test results, participants, timings, agreement or completion rates are claimed.

Design references: [The Pudding — Is the Love Song Dying?](https://pudding.cool/2024/11/love-songs/) for persistent marks and staged regrouping; [Dancing Histograms](https://www.meandeviation.com/dancing-histograms/) for common-baseline category comparison. Class connections and What–Why–How are on the website. Our SVG layout and interactions are custom; D3 is [BSD-licensed](vendor/D3-LICENSE).

Pushes to `main` run validation and deploy the public-only bundle using GitHub Actions. The [saved scrolling website](pre-slides.html) uses its own six frozen page/script/style assets. Tag `pre-slides-layout-2026-10-18` preserves the full tree at `07b158262cc0259f6d992cd29b249c4cffe62949`. Earlier [pre-modal](pre-modal.html), [interim](interim.html) and [handoff](handoff.html) pages and recovery tags remain available. See the [page-layout checklist](docs/slide-layout-checklist.md) and recovery log.

The final report, poster and presentation are separate submission deliverables; this website release does not assert that those are complete.
