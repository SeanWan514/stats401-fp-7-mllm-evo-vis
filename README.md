# From Pixels to Intelligence

An interactive history of open-weight multimodal large language models (MLLMs), developed as Group 7's final visualization project for STATS 401: Data Acquisition and Visualization.

## Group 7

- Sean Wan — Project Lead
- Yuxuan Huang
- Shilin Ou

## Project Overview

This project examines how major multimodal language models have evolved in scale, architecture, provider, openness, and benchmark performance. The interim D3 page reframes the proposal as a model-choice aid and includes a linked three-plane tensor view, a parameter timeline, and a preliminary provider-to-family network.

See the complete [project proposal](proposal.md), including research questions, datasets, visualization sketches, group responsibilities, interim deliverables, and the Week 2–7 timeline.

## Repository Structure

```text
.
├── index.html
├── app.js
├── styles.css
├── proposal.md
├── data/
│   ├── OpenVLM.json
│   ├── interim_models.json
│   └── comments_example.jsonl
├── scripts/
│   ├── build_interim_data.py
│   ├── discover_hf_models.py
│   └── score_comments.py
└── images/
    └── visualization-sketches.svg
```

## Reproduce the Interim Build

From the project directory:

```powershell
python scripts/build_interim_data.py
python -m http.server 8000
```

Open `http://localhost:8000/`. A web server is required because the page loads JSON with `d3.json`.

The raw OpenVLM file is not modified. `build_interim_data.py` extracts the fields used by the prototype, records missingness, and creates a compact processed file. The script reports 285 model records, 6,584 model–benchmark blocks, and 142,843 numeric measurements in the current snapshot.

## Interim Check-In Coverage

- **Dataset:** the page describes the raw and processed data, cleaning steps, coverage, missingness, and one release-date audit flag.
- **Working visualizations:** Overall, Language, and Vision begin in an offset 01 → 02 → 03 stack. Choosing a channel smoothly raises and expands that sheet above the others. A deterministic collision layout separates overlapping marks while preserving their time/metric anchors; hover/focus exposes an enlarged data table, and selecting a model adds a linked enlarged marker and labeled halo across all three channels. Parameter scale and provider lineage views use the same processed data.
- **Interaction and animation plan:** every view has a planned interaction and a task-oriented purpose.
- **Evaluation plan:** the page specifies participants, tasks, measures, feedback, design checks, and success criteria.

## Data Extension Prototypes

`discover_hf_models.py` queries the public Hugging Face API and writes a candidate review queue. It does not merge candidates automatically; release date, license, parameters, architecture, and benchmark comparability require manual verification.

`score_comments.py` accepts a JSON Lines export containing `model`, `source`, `url`, `created_at`, and `text`. Its transparent lexicon is only an implementation placeholder. Before any sentiment result is used, the group should label a validation sample and report platform, language, duplication, and selection biases.

## Data Sources

- [OpenVLM Leaderboard](https://huggingface.co/spaces/opencompass/open_vlm_leaderboard)
- [VLMEvalKit](https://github.com/open-compass/VLMEvalKit)
- Hugging Face model cards and APIs
- Official model repositories and papers

## Status

Interim check-in prototype implemented. The page includes the required dataset description, processing summary, working visualizations using project data, interaction and animation plans, and evaluation plan. Provider/architecture filtering, brushing, frontier analysis, and full lineage interactions remain planned work.
