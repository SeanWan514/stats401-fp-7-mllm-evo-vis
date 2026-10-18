# Formative website review

## Completed review of the pre-revision website

- Reviewer: Sean Wan, project lead and intended researcher/developer audience member.
- Reported to the group: 18 October 2026.
- Website version: teammate handoff at commit `cff16d3cba52423b5b0eecd30bc1f613ee335ce1`, preserved as `handoff.html` and tag `pre-final-redesign-2026-10-18`.
- Method: self-directed inspection and qualitative written feedback. One project-member reviewer; no timed tasks, independent participant study, or completion/error-rate measurements.
- Overall feedback: functions appeared to work, but the reviewer needed time to understand the views; clarity, intuitiveness, robustness and visual quality needed substantial improvement.

| Reported issue | Revision response | Verification |
| --- | --- | --- |
| View 1 broadly suitable but unclear | Explicit count/type/share modes, original-versus-derivative distinction, baseline reordering and period brush | Automated count reconciliation and browser interaction checks |
| View 2 did not resemble the requested text visualization | Collision-tested phrase cloud, exact count list, capability/practical modes, source excerpts | Check packing, filtering and linked task selection |
| View 3 difficult to interpret and visually weak | Persistent model dots transition from release timeline to family groups to a within-protocol performance distribution | Check identity preservation, source-group changes and missing-score shelf |
| View 4 cluttered; axes disconnected from users | Concern-derived axis labels, measured benchmark proxies, explicit speed/memory gaps, separate benchmark-detail mode | Check raw values, fixed scales, missingness and pair changes |
| View 5 did not support task-based choice clearly | Task selection → constraints → task-linked scores → evidence panel → two-model shortlist | Check complete selection and export journey |
| Overall navigation and story unclear | User mission at opening, five numbered chapters, shared selection, concise findings and methods | Check navigation and consistent state |

## Completed production workflow check after redesign

- Reviewer: Sean Wan, the same project-member reviewer as above; this is not an additional independent participant.
- Confirmed: 18 October 2026, on the [published website](https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/), following deployment of commit `dc140e3938cc45361c58fa09dc1a55daae836043`.
- Requested checks: choose a task, assign models A/B and observe the radar update; switch the Families view between its three stages.
- Reviewer response: “Yes, both workflows work”.
- Result: both requested production workflows confirmed working by the reviewer. This closes the outstanding live-browser smoke check. No task timings, error rates or broader usability outcomes were collected.

## Subsequent clarity review and revision

- Reviewer: Sean Wan, the same project-member reviewer; no new participant is counted.
- Feedback received: 18 October 2026, after the production workflow check above, with eight screenshots and written comments on the published redesign.
- Method: qualitative visual inspection and written design feedback. This is not a new task-completion experiment.
- Overall feedback: the structure was acceptable, but excessive text, crowded controls and weak visual hierarchy obscured the charts. The five views needed a clearer user-task loop. The reviewer also reported confusing A/B controls and comparisons with too little usable evidence.

| Reported issue | Clarity revision response |
| --- | --- |
| View 1 looked broken and dim; controls and framing were excessive | Smooth cumulative filled areas, brighter categories, the first observed date as the start, fewer visible controls and shorter captions; repository creations stay distinct from verified releases |
| View 2 needed to emphasize the cloud and make frequency differences visible | Full-width phrase cloud with stronger type-size differences, clearer discussion-evidence control, compact excerpts, and exact counts/methods available on demand |
| View 3 controls were confusing; A/B selection seemed ineffective | Shorter stage descriptions, performance-only controls, compact model details, visible selected-state buttons and A/B dot labels |
| View 4 was overwhelmed by text and weak comparison pairs | Prominent six-concern radar with an optional eight-benchmark profile, a four-shared-dimension threshold, concise comparison gaps, and expandable raw evidence; 47 models have usable partners while all 57 remain in the family story |
| View 5 was visually naive and did not support an insightful decision | Task-specific score–size map with a correctly defined Pareto frontier, concise candidate evidence, constraint filters, and a direct path to compare and export two models |
| Views did not form a clear user-task loop | Concern selection links to a task; task constraints lead to candidate inspection and A/B comparison. Pinned models outside current filters are explicitly flagged, including in the evidence brief |

These responses document implementation changes, not verified gains in usability. The earlier “both workflows work” confirmation applies to the preceding deployed version. **A human workflow test of this latest clarity revision has not yet been reported.** Technical regression and browser checks are documented separately in the website audit; they must not be presented as independent participant feedback.

## Interpretation limits

The formative reviews identify design problems and motivate revisions; the recorded production check confirms that two requested workflows worked on an earlier release for the same reviewer. None establishes ease of use for new users or constitutes a representative usability study. Website inspection is separate from human validation of scraped feedback/task labels, which remains pending. Automated or AI-assisted checks must not be described as human participant results.
