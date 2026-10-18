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

## Interpretation limits

The earlier formative review identified design problems and motivated revisions; the subsequent production check confirms that two requested workflows worked for the same reviewer. Neither establishes ease of use for new users or constitutes a representative usability study. Both are separate from human validation of scraped feedback/task labels, which remains pending. Automated or AI-assisted checks must not be described as human participant results.
