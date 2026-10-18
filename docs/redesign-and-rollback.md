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

## Safe rollback

For immediate visual fallback, open `interim.html` or `handoff.html`; no Git operation is needed.

For a historical local preview without changing the working branch:

```bash
git worktree add --detach ../mllm-before-redesign pre-final-redesign-2026-10-18
cd ../mllm-before-redesign
python3 -m http.server 8766 --bind 127.0.0.1
```

To revert a deployed redesign, inspect the release commit(s), coordinate with teammates, and use `git revert <release-commit>` followed by a normal push. This preserves intervening history. Do not force-push or reset shared `main`. Recheck Pages deployment afterward.
