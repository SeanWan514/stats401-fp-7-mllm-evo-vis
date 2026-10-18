# 💻 MLLMs: Which Model for Your Task?

**STATS 401 · Group 7 · Sean Wan, Yuxuan Huang, Shilin Ou**

An interactive evidence atlas for choosing open-weight image-and-text models.

**[🌐 Explore the website](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/)** · **[📄 Final report](deliverables/Group_7_MLLMs_Final_Report.pdf)** · **[🖼️ A1 poster](deliverables/STATS401_Poster_Group_7_Wan_Huang_Ou.pdf)**

## 🎓 Grader's View — start here

**Suggested reading order:** website → final report → data and code below. No installation is required to view the published project. The PDFs in `deliverables/` are the supplied final documents; previous report drafts are archived separately.

| # | Required deliverable | Where to find it |
| :--: | --- | --- |
| 1 | **Source dataset(s)** | [OpenVLM baseline](data/OpenVLM.json) · [Preserved source-cache archive](data/archives/raw-cache-2026-10-17.tar.gz) · [Provenance and checksums](reports/public_data_manifest.json) |
| 2 | **Cleaned/processed dataset(s)** | [Data index](data/README.md) · [Repository records](data/final/repositories.jsonl) · [Community records](data/final/feedback.jsonl.gz) · [Benchmark results](data/final/benchmark_results.csv.gz) |
| 3 | **Data collection/crawler code** | [HF repositories](scripts/collect_repositories.py) · [Community discussions](scripts/collect_feedback.py) · [Official model evidence](scripts/build_final_models.py) · [Source configuration](config/) |
| 4 | **Data cleaning and analysis code** | [Feedback processing](scripts/process_feedback.py) · [Model/benchmark processing](scripts/build_final_models.py) · [View preparation](scripts/build_final_views.py) · [Concern aggregation](scripts/build_explorer_data.py) |
| 5 | **Complete visualization source code** | [HTML entry point](index.html) · [D3/SVG and interaction code](assets/js/) · [Styles](assets/css/) · [Bundled D3](vendor/) · [Tests](tests/) |
| 6 | **Published visualization website** | [Open the live, fourteen-page atlas](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/) |
| 7 | **Final report** | [Group_7_MLLMs_Final_Report.pdf](deliverables/Group_7_MLLMs_Final_Report.pdf) |
| 8 | **Final project poster** | [STATS401_Poster_Group_7_Wan_Huang_Ou.pdf](deliverables/STATS401_Poster_Group_7_Wan_Huang_Ou.pdf) — A1; also provided for the separate poster assignment |
| 9 | **Reproduction documentation** | [Quick start and rebuild](docs/quickstart.md) · [Data dictionary](docs/data-dictionary.md) · [Acquisition/processing methods](docs/data-pipeline.md) · [Script index](scripts/README.md) · [Quality evidence](reports/README.md) |

## 🧭 The question behind the project

**Which open-weight MLLMs should a researcher or developer test for a particular image-and-text task, and what evidence supports that choice?**

We connect ecosystem growth, community concerns, canonical model families and published benchmarks. Users compare two models and identify task-specific candidates within parameter-size and licensing constraints. The result is a shortlist for application testing—not an opaque universal ranking.

| View | What it helps the user do | Try it |
| --- | --- | --- |
| **1 · Ecosystem growth** | Distinguish repository expansion, derivatives and verified releases | [Reorder filled layers; inspect a month](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/#growth) |
| **2 · Community concerns** | Explore task and practical-problem mentions with source evidence | [Select a phrase; inspect matching records](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/#tasks) |
| **3 · Three perspectives** | Follow the same model dots through time, families and performance | [Switch stages; search; inspect a model](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/#evolution) |
| **4 · Capability comparison** | Compare two source-grouped benchmark profiles | [Choose a pair; inspect scores and gaps](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/#radar) |
| **5 · Task-based candidates** | Find measured candidates within parameter-size tiers | [Choose a task; filter; inspect candidates](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/#matrix) |

## 📊 Data at a glance

**Collection snapshot: 17 October 2026.** Counts describe different units and must not be added together.

| Collection | Size | Interpretation |
| --- | ---: | --- |
| Hugging Face ecosystem | **18,255 repositories** | Original distributions, fine-tunes, adapters and quantizations—not independent original models |
| Community evidence | **21,674 records** | Distinct retained GitHub/HF discussion objects—not unique users or independent reviews |
| Curated comparison set | **57 models · 10 families** | 49 have verified release dates; coverage is incomplete |
| Benchmark table | **143,086 measurements** | 142,843 baseline values + 243 official-source values, including subcategories |

**Interpretation matters.** Labels are rule-generated and not human-validated; support forums are not representative surveys. Only 1,965 records receive task labels and 1,507 map to canonical models. Missing scores remain missing. Parameter size is not measured GPU-memory usage; mention frequency is not satisfaction. Same-source grouping does not resolve undisclosed evaluation settings. See [methods and limitations](docs/README.md).

## 💻 Run and reproduce

For the prepared website, use **Python 3.10+** and `make`; no API key or recollection is needed. D3 and browser data are bundled locally.

```bash
git clone https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis.git
cd stats401-fp-7-mllm-evo-vis
make serve
```

Open **http://127.0.0.1:8765/**. `make serve` builds and serves `dist/`, including saved-version URLs. To use another port: `make serve PORT=8766`.

```bash
make check   # Python tests, JS syntax and Node regression tests; Node 20+ recommended
make site    # Build the explicitly allowlisted public website
```

Reconstruct data only in a **fresh clone or spare copy**: `make restore`, `make rebuild`, then `make reproducibility`. Processing overwrites generated tables/reports. Public-cache redaction can change initial hashes; see the [reproduction guide](docs/quickstart.md). Pages excludes raw archives and full feedback text; those remain available in the repository. Third-party source terms still apply.

## 🗂️ Repository map

```text
index.html       Current website entry point
assets/          Current JavaScript modules and styles
deliverables/    Final report and poster PDFs
data/            Source archive, baseline and processed tables
config/          Model registry and acquisition source configuration
scripts/         Acquisition, cleaning, analysis, build and verification
tests/           Automated data and interface regression checks
docs/            Methods, quick start, screenshots and review records
reports/         Counts, provenance and validation evidence
vendor/          Bundled D3 and its license
archive/         Frozen website versions and earlier report drafts
```

The original [proposal](proposal.md) is retained. [Archive notes](archive/README.md) explain saved versions and rollback; these are not the current submission.

## Design, evaluation and release

D3.js and custom SVG implement the five views. The Pudding's [*Is the Love Song Dying?*](https://pudding.cool/2024/11/love-songs/) informed persistent marks and staged regrouping; [Dancing Histograms](https://www.meandeviation.com/dancing-histograms/) informed baseline comparison. [D3's license](vendor/D3-LICENSE) is included.

[Project-member review](docs/user-review.md) guided revisions; it is not an independent user study or human-label accuracy estimate. [Website checks](docs/final-website-audit.md), [cleanup/recovery notes](docs/repository-cleanup.md) and [Actions](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/actions) document technical verification. Pushes to `main` validate and deploy the public bundle. See [CONTRIBUTING.md](CONTRIBUTING.md) before changing code or data.
