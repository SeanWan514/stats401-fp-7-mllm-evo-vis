# Final website audit · 18 October 2026

Scope: website, prepared data and code. The approximately 1,500-word report, poster, presentation and Canvas submission are separate deliverables, not certified by this audit.

## Website requirements

| Requirement | Implementation and evidence | Status |
| --- | --- | --- |
| Meaningful Why–What–How and user task | Opening mission: task → constrained candidates → two-model shortlist → measured profiles and practical evidence. Introduction explains MLLMs and decision uncertainty. | Implemented |
| Two substantial acquisitions | 18,255 unique HF repository records and 21,674 unique eligible GitHub/HF feedback source records; 57 canonical comparison models. Full-corpus counting regression passes. | Structural counts verified; semantic labels remain rule-based |
| Three-plus meaningful variables and multiple types | Family, license, derivative class, parameters, benchmark scores, timestamps, task/concern labels, source text and provenance. | Present |
| Collection, cleaning, processing, source and cleaned data | Scripts, compressed full tables, raw-cache archive, exclusions, source URLs, manifest and methodology in repository. Browser loads only aggregates and capped excerpts. | Present, with documented raw-response preservation limits |
| Five distinct interactive visualizations | Stacked area; phrase cloud; animated timeline/hierarchical family packing/performance distribution; two-model radar; custom task-linked aligned score plot. | Implemented |
| At least one complex representation | Hierarchical family packing and persistent staged model marks; text-derived phrase cloud; multidimensional radar. | Implemented |
| Five-plus meaningful interactions | Filtering, sorting, persistent selection, temporal brushing, linked task/pair selection, search highlighting, variable/protocol switching, details on demand, staged playback and shortlist export. | Implemented |
| D3 and custom visualization effort | Locally bundled D3 7.9.0; custom SVG marks, phrase placement, family layouts/transitions, raw-source controls and task-model links. | Implemented |
| Coherent storytelling | Context/datasets → ecosystem scale → user concerns → family context → measured differences → task-specific shortlist → findings/limitations. | Implemented |
| Clear units and uncertainty | Repositories ≠ original models; feedback ≠ users/reviews; exact-model versus family evidence; unknown dates/scores; stable radar scales and source protocol groups. | Implemented |
| Accessible browser deployment | Main HTML entry, legacy final URL redirect, responsive controls, keyboard-operable marks, focus states, reduced motion, pause controls, raw tables and source links. | Browser checks conducted; not a formal accessibility certification |
| Reproducibility and documentation | README, data dictionary, scripts, 41 regression tests, audit and recovery log. | Present |

## Requested design revisions

1. **Structure and task:** editorial opening, explicit audience/mission, numbered story, shared filters and final shortlist.
2. **Data targets:** both exceed 10,000 under documented source-object counting. No new unrelated scraping was added merely to inflate counts.
3. **View 1:** filled stacked areas, monthly/cumulative/share toggles, derivative classes, selectable common baseline and period brush. Repository creation and verified release modes remain distinct. October is a partial collection month.
4. **View 2:** real phrase cloud with collision checks, 15 concern categories, eight task mappings, exact ranked values, source/experience filters and linked selection. Frequency means sampled mentions, not universal importance.
5. **View 3:** the same 57 model marks regroup from dates to families to measured performance. This adapts The Pudding's persistent-mark storytelling approach without copying its assets or source. Family membership does not claim ancestry.
6. **View 4:** eight selected user-derived concerns. Six have benchmark proxies; speed and memory remain unmeasured. A separate eight-benchmark mode shows available detail. The axes are not asserted to be the top eight concerns or independent abilities.
7. **View 5:** choose a supported task, constrain parameters/license/family, inspect a within-source score and exact-model feedback, then pin a comparison pair. No unjustified universal recommendation score.
8. **Class connections:** What–Why–How table; temporal/text views, hierarchy, channel effectiveness, coordinated interactions and staged motion. Common-baseline reordering credits Dancing Histograms.
9. **Review:** Sean's one-person qualitative review of the old site is complete and recorded in [user-review.md](user-review.md). It is not feedback-label validation or evidence that new users succeeded on the revised site.
10. **Recovery:** both previous pages are preserved, with original scripts and payload unchanged. The annotated pre-redesign tag preserves the full old repository. See [recovery instructions](redesign-and-rollback.md).

## Verification record

- 22 existing Python unit tests, 9 feedback-processing tests and 10 new JavaScript/payload tests passed: **41 total**.
- JavaScript syntax and Git whitespace checks passed.
- Full gzip/JSONL counts and unique IDs reconciled; every concern count is bounded by the corpus and source-filter totals reconcile.
- Default benchmark pair has eight shared-source measurements; concern mode intentionally measures six of eight axes. Sparse pairs and no-shared-source conditions do not become zero scores.
- All five chart containers render real SVG and all 57 model marks are present in the unfiltered family story.
- Cloud: all 15 phrases visible and no bounding-box intersections at the tested desktop size; selecting a task updates the mapper.
- Browser-tested constrained candidate selection → pair assignment → radar update; empty license/family combinations display an explicit recovery message.
- Model selection remains consistent between family and candidate detail panels. Missing-score shelf uses separate per-family cells.
- Mobile check at 390 × 844: document width equals viewport width; wide data plots scroll within their containers, not the page.
- Source-code and evidence limitations are exposed rather than hidden by attractive styling.

## Published release verification

Implementation commit: `66dbf30e077a3858615226d65d5bea9115560b63`.

- [GitHub validation](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/actions/runs/39106927160): passed.
- [GitHub Pages deployment](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/actions/runs/39106927049): passed.
- Nine public core/data/fallback files returned successfully over HTTPS and matched the local tested release byte-for-byte. See [machine-readable verification](../reports/production_release_check.json); repeat with `python3 scripts/verify_deployed_site.py`.
- The module is served as JavaScript and the JSON payload supports gzip (approximately 323 KB transferred versus 2.86 MB uncompressed).
- The local deployment bundle passed the old `final.html#radar` redirect, real brush-handle drag, and downloaded shortlist-content checks. Desktop and phone interaction checks used this local bundle.
- **Production-browser limitation:** the in-app browser repeatedly timed out when inspecting the live HTTPS page. This did not occur in local interaction testing. HTTP/hash checks verify publication, but are not mislabeled as a successful live interactive test.

Minimum remaining release check: in an ordinary browser, open the published website, select a task, choose model A and B, and confirm that the radar updates and the family-stage controls work. This is a new-site smoke check, separate from Sean's completed review of the old site. It should take approximately two minutes. Do not claim that all ten requested checks are unconditionally closed before this succeeds.

## Honest readiness limits

This website addresses the explicit website requirements; that is not a promise of full marks or top-three rank. The strongest remaining methodological improvement is human validation of task/concern labels and model attribution. No agreement/accuracy metric has been invented. A new target-user test of the redesigned site has not been conducted. Some benchmark protocols remain incomplete, and many task/model cells lack controlled evidence. These limitations are disclosed on the site and should appear in the report.

Final submission still requires the report, poster, complete package and presentation preparation. The website URL is not itself proof that those deliverables are complete.
