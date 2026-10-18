# Redesign and recovery log · 18 October 2026

## Preserved before editing

- Original source commit: `cff16d3cba52423b5b0eecd30bc1f613ee335ce1`.
- Annotated tag: `pre-final-redesign-2026-10-18` preserves both sites, their scripts and data.
- `interim.html` is a byte-identical copy of that commit's `index.html`.
- `handoff.html` is a byte-identical copy of that commit's `final.html`.
- Original `app.js`, `styles.css`, `final.js`, `final.css` and `data/final/view_data.json` are unchanged.
- An additional complete local Git archive was made before implementation. The tag is the portable recovery mechanism.

## Revision

- Main page now presents an editorial, coral-toned evidence atlas with an explicit user task, datasets, five linked views, findings and methods.
- `explorer.js`, `explorer-core.mjs`, `explorer.css` are independent of both fallback implementations.
- `build_explorer_data.py` derives concern counts from the published cleaned feedback; it does not rewrite the original corpus or fabricate measurements.
- The family view preserves model identities across staged time, hierarchical grouping and performance views. The cloud exposes exact counts and sources. Radar axes are concern-led, with unmeasured speed/memory. Task mapping produces a source-linked two-model shortlist.
- `final.html` forwards old final links to the main view, preserving hashes.
- D3 is bundled locally with its license; original fallback pages retain their original dependencies.
- Sean's completed old-site review is documented separately from technical checks and pending annotation validation.

## Clarity refinement · 18 October 2026

- The immediately preceding checked release is `b8d64aaf7afb77871d444287119614303901d9dd`.
- Published backup tag `pre-clarity-refinement-2026-10-18` preserves that release before the refinement. The original `interim.html`/`handoff.html` fallbacks and earlier pre-redesign tag remain unchanged.
- The area view now prioritizes smooth cumulative counts from the first dated record, with brighter colors and fewer controls. Curves connect exact monthly values; they do not imply daily observations.
- The phrase cloud now occupies the main visual space; exact count lists and methodology are available on demand. Performance-only family controls, shorter explanations and compact model details reduce clutter.
- Comparison actions require at least four shared benchmark dimensions and explicitly announce any partner adjustment. The main radar uses six measured concern proxies, with speed/memory limitations stated separately; eight-benchmark detail mode remains available.
- The task view now compares benchmark score against parameter count and highlights its empirical size–score frontier. Unmeasured/unknown-size candidates are retained separately, not assigned zero scores or silently deleted.
- Sean's prior production check applies to the preceding release. His subsequent clarity feedback prompted this refinement; no new human test, annotation accuracy or independent participant result has been fabricated.
- Released implementation: `bc2fe8263faafd576ebc21cba256f51eb914f852`. All 46 regression tests, local desktop/mobile checks, GitHub validation and Pages deployment passed. Nine public files matched the tested version over HTTPS. The current public page still timed out in the in-app browser, so this is not recorded as a successful live interactive test. See the [website audit](final-website-audit.md) for evidence and limits.

## Safe rollback

For immediate visual fallback, open `interim.html` or `handoff.html`; no Git operation is needed.

To preview the checked version immediately before the clarity refinement without changing the working branch:

```bash
git worktree add --detach ../mllm-before-clarity pre-clarity-refinement-2026-10-18
cd ../mllm-before-clarity
python3 -m http.server 8767 --bind 127.0.0.1
```

For a historical local preview without changing the working branch:

```bash
git worktree add --detach ../mllm-before-redesign pre-final-redesign-2026-10-18
cd ../mllm-before-redesign
python3 -m http.server 8766 --bind 127.0.0.1
```

To revert a deployed redesign, inspect the release commit(s), coordinate with teammates, and use `git revert <release-commit>` followed by a normal push. This preserves intervening history. Do not force-push or reset shared `main`. Recheck Pages deployment afterward.

## Modal and size-tier refinement · 18 October 2026

- Pre-revision commit: `bfe6314ea937c1bd37c42ce6eb77b31cb7a954de`, preserved by annotated tag `pre-modal-redesign-2026-10-18`.
- Immediate visual fallback: `pre-modal.html`, with `pre-modal.js`, `pre-modal.css` and `pre-modal-core.mjs` (four saved files in total). The saved page and JavaScript reference these saved implementation assets. Bundled D3 and data remain shared; the tag preserves the complete historical tree for full recovery.
- Existing `interim.html`, `handoff.html` and the earlier recovery tags remain unchanged.
- Growth now displays repository history from January 2023 while retaining the 15 earlier records in the cumulative baseline. Hover/tap/keyboard month inspection replaces zoom brushing; the full repository total remains 18,255.
- Explanations, exact counts and source evidence move into modal dialogs. The cloud retains the 21,674-record feedback corpus; the family view retains 57 curated models. Standalone A/B selectors remain in the radar chapter instead of sharing candidate-selection controls across the page.
- Task selection now uses source-consistent size-tier rankings. Five supported tasks are selectable; all eight task categories remain in the dataset. Other candidates, unmeasured scores and unknown sizes remain accessible in the complete list.
- This entry records implementation and preservation only. Final tests, browser acceptance, push/deployment and published-file verification are pending for this revision. Prior human checks are not represented as checks of this revised interface. See [the refinement checklist](modal-refinement-checklist.md) and [website audit](final-website-audit.md).

For immediate comparison, open `pre-modal.html`; no Git change is needed. To preview the complete historical tree without altering the current branch:

```bash
git worktree add --detach ../mllm-before-modal pre-modal-redesign-2026-10-18
cd ../mllm-before-modal
python3 -m http.server 8768 --bind 127.0.0.1
```

If a deployed modal revision must be rolled back, first identify its release commit(s), preserve teammates' subsequent changes, and use normal `git revert` commits followed by validation and deployment. Do not reset or force-push shared history.
