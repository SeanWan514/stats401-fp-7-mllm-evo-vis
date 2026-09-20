# Requirements Audit

## Interim Check-In

| Requirement | Implementation |
| --- | --- |
| Raw and processed datasets | The Dataset section names `OpenVLM.json` and `interim_models.json`, explains acquisition, rationale, cleaning, coverage, missingness, and the date anomaly. |
| Three working static visualizations | Six D3 visualizations render from the actual processed snapshot. Each has a useful default state before interaction. |
| Interaction/animation plan | A dedicated table states the planned interaction and analytical purpose for every view; several controls are already implemented. |
| Evaluation plan | The Evaluation section states what will be evaluated, how it will be tested, what evidence will be collected, and success criteria. |

## Final-Project Alignment

- **Coherent story:** the sequence moves from context to data provenance, overview, comparison, exploration, interpretation, and next steps.
- **Distinct visual idioms:** animated bars/timeline, radar chart, heatmap, log scatterplot, layered landscape, and node-link network.
- **Complex representation:** the provider–family network exposes structural relationships; the radar view supports multivariate comparison.
- **Meaningful interactions:** play/pause and scrubbing, model selection, linked heatmap selection, sorting, metric switching, openness filtering, frontier display, landscape switching, and network highlighting.
- **Primarily D3:** all six charts are constructed with D3; HTML and CSS provide narrative structure and controls.
- **Reproducibility:** raw data, processed data, transformation scripts, page source, methodology notes, and deployment workflow are version controlled.

## Remaining Final Deliverables

This interim MVP does not claim that the final project is complete. The team must still expand and validate the dataset, finish coordinated interactions, conduct and report the evaluation, write the approximately 1,500-word final report, and prepare the required poster/presentation materials.
