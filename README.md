# From Pixels to Intelligence

An interactive guide to the evolution and practical selection of open-weight multimodal large language models (MLLMs), developed by Group 7 for STATS 401: Data Acquisition and Visualization.

**Live site:** [https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/)

## Final data handoff (2026-10-17)

**Published five-view site:** [MLLM Evidence Explorer](https://owen-1234.github.io/mllm-evidence-explorer/) · [dedicated website repository](https://github.com/Owen-1234/mllm-evidence-explorer) · [中文交付报告](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/delivery-zh.md).

The `shilin` branch adds reproducible repository and community-data collection, curated canonical model metadata, preserved benchmark measurements, and a separate five-view [Data Handoff Explorer](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/final.html). See [data pipeline and reproduction](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/data-pipeline.md), [model evidence](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/model-methodology.md), [feedback methodology](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/feedback-methodology.md), and [view contract](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/final-view-contract.md).

Run `python3 -m http.server 8765 --bind 127.0.0.1` and open `http://127.0.0.1:8765/final.html`. The prepared small browser payload is included. Full feedback and raw caches are now public in this group branch: [feedback gzip](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/final/feedback.jsonl.gz), [raw archive](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/archives/raw-cache-2026-10-17.tar.gz) and [restoration instructions](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/data/archives/README.md). See the [delivery report](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/delivery.md) and [structural checks](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/reports/final_validation.json). Machine feedback labels are rule-generated suggestions; their empirical accuracy has not been measured.

The sections below describe the preserved interim prototype. They are not a claim that the revised final-project research validation is complete.

## Group 7

- Sean Wan — Project Lead
- Yuxuan Huang
- Shilin Ou

## Project Overview

The site follows a six-part narrative: opening, introduction, dataset, visualizations, evaluation, and next steps. It explains MLLMs from first principles, documents the raw and processed data, and presents six coordinated D3 views:

1. animated model-release history;
2. two-model radar comparison;
3. sortable benchmark heatmap;
4. parameter–performance scatterplot with a descriptive Pareto frontier;
5. overall/language/vision model landscape;
6. provider–family network.

Each view includes a legend, an analytical purpose, and a planned interaction. The page distinguishes results supported by the current snapshot from future work.

See the [project proposal](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/proposal.md), [requirements audit](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/docs/requirements-audit.md), and [change log](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/blob/shilin/CHANGELOG.md).

## Repository Structure

```text
.
├── index.html
├── app.js
├── styles.css
├── proposal.md
├── CHANGELOG.md
├── data/
│   ├── OpenVLM.json
│   ├── interim_models.json
│   └── comments_example.jsonl
├── docs/
│   └── requirements-audit.md
├── images/
│   └── visualization-sketches.svg
└── scripts/
    ├── build_interim_data.py
    ├── build_static_site.py
    ├── discover_hf_models.py
    └── score_comments.py
```

## Reproduce the Site

From the project directory:

```bash
python3 scripts/build_interim_data.py
python3 -m http.server 8000
```

Open `http://localhost:8000/`. A local server is required because the page loads JSON with `d3.json`.

The raw OpenVLM file is not modified. The processing script creates a compact visualization file while preserving missing values and recording an anomalous post-snapshot release date. The current snapshot contains 285 model records, 6,584 model–benchmark blocks, and 142,843 numeric measurements.

To create the deployable static bundle, run:

```bash
python3 scripts/build_static_site.py
```

## Data Sources

- [OpenVLM Leaderboard](https://huggingface.co/spaces/opencompass/open_vlm_leaderboard)
- [VLMEvalKit](https://github.com/open-compass/VLMEvalKit)
- Hugging Face model cards and APIs
- Official model repositories and papers

## Responsible Extension Work

`discover_hf_models.py` generates a candidate review queue from the public Hugging Face API; it does not automatically merge unverified records. `score_comments.py` is a transparent placeholder for future public-comment analysis. No social-media result will be reported until the group documents platform rules, collection criteria, de-identification, consent expectations, sampling bias, and validation quality.

## Status

The interim MVP is implemented and deployed. The remaining final-project work includes enlarging and validating the dataset, completing richer coordinated interactions, conducting the planned usability evaluation, and preparing the final report and poster.
