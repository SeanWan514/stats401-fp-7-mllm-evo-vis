# Final website audit · 18 October 2026

Scope: website, prepared data and code. The approximately 1,500-word report, poster, presentation and Canvas submission are separate deliverables, not certified by this audit.

## Current revision status

**Clarity refinement: local verification passed; publication verification pending.** The previous checked release, recorded at `b8d64aaf7afb77871d444287119614303901d9dd`, remains available through `pre-clarity-refinement-2026-10-18`. Its website GO decision and Sean's completed workflow check do not automatically certify this revision. The new technical checks are recorded separately below. No new participant study or feedback-label validation is claimed.

## Website requirements

| Requirement | Implementation and evidence | Status |
| --- | --- | --- |
| Meaningful Why–What–How and user task | Opening mission: task → constrained candidates → two-model shortlist → measured profiles and practical evidence. Introduction explains MLLMs and decision uncertainty. | Implemented |
| Two substantial acquisitions | 18,255 unique HF repository records and 21,674 unique eligible GitHub/HF feedback source records; 57 canonical comparison models. Full-corpus counting regression passes. | Structural counts verified; semantic labels remain rule-based |
| Three-plus meaningful variables and multiple types | Family, license, derivative class, parameters, benchmark scores, timestamps, task/concern labels, source text and provenance. | Present |
| Collection, cleaning, processing, source and cleaned data | Scripts, compressed full tables, raw-cache archive, exclusions, source URLs, manifest and methodology in repository. Browser loads only aggregates and capped excerpts. | Present, with documented raw-response preservation limits |
| Five distinct interactive visualizations | Smooth cumulative stacked area; phrase cloud; animated timeline/hierarchical family packing/performance distribution; two-model radar; task-linked size–score tradeoff map with an empirical frontier. | Implemented and browser-tested |
| At least one complex representation | Hierarchical family packing and persistent staged model marks; text-derived phrase cloud; multidimensional radar. | Implemented |
| Five-plus meaningful interactions | Filtering, sorting, persistent selection, temporal brushing, linked task/pair selection, search highlighting, variable/protocol switching, details on demand, staged playback and shortlist export. | Implemented |
| D3 and custom visualization effort | Locally bundled D3 7.9.0; custom SVG marks, phrase placement, family layouts/transitions, source controls and task-specific frontier/selection. | Implemented |
| Coherent storytelling | Context/datasets → ecosystem scale → user concerns → family context → measured differences → task-specific shortlist → findings/limitations. | Implemented |
| Clear units and uncertainty | Repositories ≠ original models; feedback ≠ users/reviews; exact-model versus family evidence; unknown dates/scores; stable radar scales and source protocol groups. | Implemented |
| Accessible browser deployment | Main HTML entry, legacy final URL redirect, responsive controls, keyboard-operable marks, focus states, reduced motion, pause controls, raw tables and source links. | Browser checks conducted; not a formal accessibility certification |
| Reproducibility and documentation | README, data dictionary, scripts, regression tests, audit and recovery log. All 46 current regression tests pass. | Verified |

## Requested design revisions

1. **Structure and task:** editorial opening, explicit audience/mission, numbered story, shared filters and final shortlist.
2. **Data targets:** both exceed 10,000 under documented source-object counting. No new unrelated scraping was added merely to inflate counts.
3. **View 1:** brighter, smooth cumulative filled areas beginning at the first dated record in the selected collection. Monthly/share modes were removed; the essential collection and grouping controls remain, along with baseline reordering and zoom. Curves connect exact monthly cumulative counts, not estimated daily releases. Repository creations and verified releases remain separate; the last month is partial.
4. **View 2:** a full-width phrase cloud gives greater prominence to differences in mention counts. Redundant category tabs were removed, exact ranked counts and methodology moved behind disclosures, and evidence filtering uses clearer labels. Selecting a task remains linked to the shortlist. Frequency means sampled mentions, not universal importance.
5. **View 3:** the same 57 model marks regroup from dates to families to measured performance. Stage-specific controls appear only for Performance; narratives and model cards are shorter, with sources/relationships behind details. A/B markers reveal the selected pair. This adapts The Pudding's persistent-mark storytelling approach without claiming model ancestry.
6. **View 4:** the main radar emphasizes six concern-derived benchmark proxies; speed and memory remain explicit unmeasured practical concerns outside the polygon. The separate eight-benchmark detail mode remains. Pair choices require at least four shared benchmark dimensions, and any automatic partner change is announced. This prevents empty comparisons without fabricating missing scores or asserting independent abilities.
7. **View 5:** task → constraints → size–score tradeoff map → evidence → A/B comparison. A frontier candidate has no alternative with at least its score and no more parameters, with strict improvement on either dimension, within the selected data/source group. This is not measured hardware efficiency or a universal recommendation. Models lacking score/size evidence remain accessible in a separate candidate list. Benchmark/source details are collapsed by default.
8. **Class connections:** What–Why–How table; temporal/text views, hierarchy, channel effectiveness, coordinated interactions and staged motion. Common-baseline reordering credits Dancing Histograms.
9. **Review:** Sean's qualitative review of the old site and his subsequent production workflow check are complete and recorded in [user-review.md](user-review.md). The same project-member reviewer confirmed task selection → A/B assignment → radar update and switching between all three family stages before this refinement. His new visual/clarity feedback motivates this revision; it is not a completed test of the revised implementation, feedback-label validation or an independent user study.
10. **Recovery:** both original fallback pages remain preserved. The additional tag `pre-clarity-refinement-2026-10-18` records the checked website immediately before these changes. See [recovery instructions](redesign-and-rollback.md).

## Verification record — clarity refinement

- **46 tests passed:** 22 Python unit tests, 9 feedback-processing tests and 15 JavaScript evidence/payload tests. JavaScript syntax and Git whitespace checks passed; the allowlisted static bundle builds successfully.
- Desktop browser checks used the actual built bundle: all five views render; cloud selection links to the selected task; map selection assigns the exact model to A/B and updates the radar; incompatible partner replacement is explicitly announced.
- Family stages retain the same models. Performance controls are hidden in the other stages; displayed source-group counts reconcile with measured dots. A family with repositories but no canonical models shows an explicit empty state, and Reset exploration restores all 57 models.
- Smooth growth curves begin at the first dated record in each collection. A real brush drag changed the visible range without resetting cumulative history; Reset view restored the full range and 18,255-repository total.
- All 15 cloud phrases fit without bounding-box collisions at the tested desktop size. Mobile rendering at 390 × 844 uses a portrait cloud and a fitted radar; the document has no horizontal overflow. Wide analytical plots scroll within their own containers.
- Radar selectors only offer pairs sharing at least four measured concern dimensions. The 47-model comparison pool does not remove the other 10 models from the family explorer. Missing results are not zeros; pinned models outside current filters have visible warnings.
- Task/source/filter changes reset the inspected candidate coherently. Impossible filter combinations and video tasks without collected benchmarks show explicit gaps, not fabricated recommendations. The empirical frontier handles tied sizes and scores in regression tests.
- The browser downloaded an evidence brief containing the current task, exact A/B models, parameter/license metadata, filter eligibility, score sources and limitations; the saved file was inspected.
- No browser warnings or errors were recorded in the checked local session. [Radar screenshot](screenshots/clarity-refinement/radar-desktop.jpg) and [shortlist screenshot](screenshots/clarity-refinement/shortlist-desktop.jpg) preserve the tested layout.
- A separate code review found no remaining release-blocking pairing, frontier or state-management issue. These checks are technical verification, not a new human usability study or semantic label validation.

## Verification record — preceding release

The checks in this section apply to the earlier release recorded at `b8d64aa`. They are historical evidence, not an assertion that the current refinement has passed the same checks.

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

## Published release verification — preceding release

Implementation commit: `66dbf30e077a3858615226d65d5bea9115560b63`.

- [GitHub validation](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/actions/runs/39106927160): passed.
- [GitHub Pages deployment](https://github.com/SeanWan514/stats401-fp-7-mllm-evo-vis/actions/runs/39106927049): passed.
- Nine public core/data/fallback files returned successfully over HTTPS and matched the local tested release byte-for-byte. See [machine-readable verification](../reports/production_release_check.json); repeat with `python3 scripts/verify_deployed_site.py`.
- The module is served as JavaScript and the JSON payload supports gzip (approximately 323 KB transferred versus 2.86 MB uncompressed).
- The local deployment bundle passed the old `final.html#radar` redirect, real brush-handle drag, and downloaded shortlist-content checks. Desktop and phone interaction checks used this local bundle.
- **Production-browser limitation:** the in-app browser repeatedly timed out when inspecting the live HTTPS page. This did not occur in local interaction testing. HTTP/hash checks verify publication, but are not mislabeled as a successful live interactive test.

**Production workflow check completed:** after deployment of `dc140e3938cc45361c58fa09dc1a55daae836043`, Sean confirmed the requested task-selection/A–B/radar workflow and three-stage Families workflow: “Yes, both workflows work”. This user-reported check closes the outstanding live-browser smoke check; it does not retroactively turn the in-app browser timeout into a successful automated test.

**Preceding website release decision: GO**, recorded in `b8d64aa`, with the methodological limitations below disclosed. **Clarity-refinement decision: pending verification.** Neither decision is an unconditional certification of every grading criterion or the complete final-submission package.

## Honest readiness limits

This website addresses the explicit website requirements; that is not a promise of full marks or top-three rank. The strongest remaining methodological improvement is human validation of task/concern labels and model attribution. No agreement/accuracy metric has been invented. The redesigned site's production workflows were checked by one project member; an independent target-user study has not been conducted. Some benchmark protocols remain incomplete, and many task/model cells lack controlled evidence. These limitations are disclosed on the site and should appear in the report.

Final submission still requires the report, poster, complete package and presentation preparation. The website URL is not itself proof that those deliverables are complete.
