# Feedback acquisition, cleaning, and baseline labels

This is a collection of actual public community text objects from specialized image-and-text model repositories. It is not a survey of all users and is not a representative estimate of model satisfaction. The current counts and exclusions are recorded in `reports/feedback_quality.json`; collection success and failure are recorded by source in `reports/feedback_*collection.json` and retry reports.

## Collection unit and scope

- One GitHub issue body or one issue comment is one object. Both open and closed issues are included. Repository issue and comment endpoints are paginated in batches of 100 until exhaustion. Pull requests are detected by joining comment thread numbers to issue metadata and excluded from the final corpus. The repository comment endpoint avoids making one request for every individual thread.
- One visible Hugging Face `DiscussionComment` event is one object. The SDK paginates model discussions, and a separate details request retrieves typed events. Pull requests, hidden comments, commits, renames, and status events are excluded. A discussion title or discussion count is never substituted for comment text.
- The configured GitHub repositories are dedicated model-family projects, so association is at the family level. A question in a family repository is not evidence that the author used every family member. GitHub `model_ids` therefore remain empty.
- HF model-repository context gives repository association. `model_repo_ids` retains that repository; `model_ids` includes a canonical model ID only when the repository exactly matches `config/canonical_models.json`. Explicit references to a different variant from the same model publisher downgrade the record to family attribution, clear exact model IDs, and retain the conflicting references. The source repository remains available in `source_model_repo_id`. This still does not prove that every commenter personally tested the model.
- The collector currently uses GitHub **Issues**, not GitHub Discussions. These are different API resources. No GitHub Discussions or Reddit records are claimed in this snapshot.
- Audio-only MiniCPM topics and video-only topics lacking image/vision context are excluded from the primary image-and-text corpus. Combined image/video feedback may carry a secondary video tag.

Sources are explicit in `config/feedback_sources.json`. Every accepted object retains source identity, source URL, published timestamp, collection timestamp, family association, and attribution evidence. In normalized and final data, public author handles are hashed for within-author duplicate detection, and user profiles are not retained. Obvious email addresses and access-token patterns are redacted there; this is pattern-based redaction and not a claim that all personal information has been removed. Original API bodies include the public fields supplied by the platforms and are kept only in the local ignored archive.

## Reproducible commands

Install `huggingface_hub`, and use an authenticated `gh` CLI for practical GitHub rate limits. The script delegates authentication to `gh`; it does not read, print, or save credentials. HF is accessed publicly with `token=False`.

```sh
python scripts/collect_feedback.py --source-limit 3 --page-limit 1 --hf-thread-limit 10 --report-name feedback_pilot_collection
python scripts/process_feedback.py --report-name feedback_pilot_quality
python scripts/collect_feedback.py --platform github --workers 4 --report-name feedback_github_collection
python scripts/collect_feedback.py --platform huggingface --workers 2 --report-name feedback_huggingface_collection
python scripts/collect_feedback.py --platform huggingface --retry-errors-from reports/feedback_huggingface_collection.json --workers 1 --report-name feedback_huggingface_retry
python scripts/process_feedback.py
python scripts/test_feedback_processing.py
```

Individual API pages and HF discussions are cached under `data/raw/feedback/`. Rerunning resumes from those cached units. `data/raw/feedback/normalized/` contains the input objects for deterministic processing. Caches represent a fixed collection snapshot, so a future refresh should use a separately archived snapshot rather than silently mix updated pages. Reports distinguish a limited pilot from an exhaustive source run. A failed source is not reported as empty or complete.

**Raw-response limitation:** the initial full collection preserved selected normalized fields and complete comment text, not every original API response. This is not described as a complete first-fetch raw archive. A later explicit backfill saved two representative successful API responses for each configured source (36 GitHub and 56 HF), plus four HF redirect bodies. These 96 local gzip bodies have URL, retrieval time, HTTP status, and SHA-256 metadata; all hashes were checked. They are labeled `backfill_later_snapshot`, since deleted or edited content can differ from the first fetch. `reports/feedback_raw_provenance.json` records this coverage. The updated collector archives bodies on future uncached requests. The full initial set of normalized objects remains sufficient to reproduce the current cleaned corpus and labels offline.

The first real pilot collected 600 GitHub objects from LLaVA, InternVL, and Qwen-VL. Its initial filter retained 332, excluding 47 PR objects, 91 short/non-substantive objects, and 130 maintainer replies. The later production filter additionally excludes explicit promotion, audio-only/video-only topics, and duplicate long texts, so the pilot is an implementation check rather than a final quality estimate.

## Cleaning and independent counts

Identity is `(platform, object_type, source_object_id)`. GitHub issue IDs and comment IDs occupy different namespaces. Alternate repository routes and repeated runs do not produce new objects. A second duplicate rule removes an exact normalized long text only when it has the same hashed author and is at least 160 characters; short similar observations from different authors are kept. There is no fuzzy duplicate threshold and no sentence splitting.

Filtering removes bot and known maintainer responses from GitHub, unresolved thread types, empty/very short text after removing code fences and quoted text, explicit directory promotions, repository administration, and the excluded modality-only topics. Email-reply tails starting with original-message/原始邮件 markers are removed before classification and length checks; another person's quoted text cannot make an acknowledgement substantive. Empty issue-form instructions and signature-only replies are also removed. General community discussion with no task, aspect, or concrete model-use signal is excluded. Chinese text can pass with 12 Han characters; otherwise the minimum is 25 Latin/Han letters. These thresholds are transparent heuristics, not proof that every retained text is informative. Usage questions, problem reports, feature requests, experiences, and substantive community discussion are retained. Raw exclusions remain inspectable through IDs in `reports/feedback_exclusions.jsonl`.

GitHub roles use `author_association`: OWNER/MEMBER/COLLABORATOR are maintainer and excluded; Bot accounts are excluded. Other contributors can be end users or developers. HF does not provide an equivalent reliable role classification in this pipeline, so its role is **unknown**, not asserted to be a non-maintainer. Those records are separately counted.

## Labels and task mapping

`data/final/tasks.json` records task IDs, labels, definitions, inclusion terms, benchmark IDs, and mapping rationale. A task is assigned only when the feedback text directly matches a listed term. Missing task evidence yields `task_ids: []`; repository association is not enough to invent a task. General deployment, memory, installation, or inference feedback can be valid community evidence while remaining unclassified by user task.

Chinese “推理” is retained as a reasoning candidate, following the user's instruction. Capability, mathematical, logical, visual, and multistep contexts assign `visual-reasoning`; speed, memory, deployment, CUDA/vLLM, and error-only contexts resolve to runtime experience. Ambiguous occurrences are retained in `task_candidates` with `reasoning_term_resolution: ambiguous`. A chat template is setup evidence rather than a conversation-task label. English task terms use word boundaries so documentation and matplotlib do not accidentally become document/chart tasks.

The aspect baseline covers accuracy, latency, memory, reliability, setup, instruction following, and licensing. Polarity is calculated within clauses containing each aspect: “accurate but slow” becomes positive accuracy and negative latency while overall sentiment is mixed. Small English and Chinese lexicons handle local negation (including “not good”, “不准确”, and “不慢”) and mixed positive/negative evidence. Unknown is preserved when there is no polarity evidence; support for languages and constructions is limited. `evaluative_status` separately identifies questions without evaluative evidence. The numeric confidences are heuristic indicators, **not calibrated probabilities**. Mixed polarity and unknown must remain visible in downstream aggregations.

All labels use `label_method: transparent_rules_v1` and `validation_status: pending_human_review`. `reports/feedback_annotation_250.csv` contains 250 real objects selected deterministically across platform × family × suggested sentiment; the human annotation fields are blank. **Sean's review and independent second-rater validation have not been completed.** No sentiment accuracy, annotator agreement, Cohen's kappa, or human-validated task precision is reported. Nine executable regression tests cover polarity, aspect separation, task context, source-object counts, PR/bot exclusion, family attribution, variant conflicts, quoted email, empty forms, and Unicode JSONL. These check implementation behavior only; they do not validate labeling accuracy on community feedback.

## Interpretation limits

Issue trackers overrepresent errors and troubleshooting, and source coverage is strongly uneven. More feedback for an older or popular family is not evidence that it performs better or worse. Long threads can contain dependent follow-up comments even when each object is independently authored; analyses should retain thread identifiers and avoid treating the records as independent experimental subjects. Popularity, benchmark scores, and community feedback are separate evidence sources. Model-level feedback must never be copied to sibling model IDs, and family evidence should remain visibly separate from exact repository evidence.

## Official API references

- [Hugging Face HfApi](https://huggingface.co/docs/huggingface_hub/en/package_reference/hf_api) and [discussion event structures](https://huggingface.co/docs/huggingface_hub/en/package_reference/community).
- [Hugging Face rate limits](https://huggingface.co/docs/hub/rate-limits): HTTP 429 handling and bounded retries are part of collection; a retry failure is recorded.
- [GitHub Issues](https://docs.github.com/en/rest/issues/issues), [issue comments](https://docs.github.com/en/rest/issues/comments), and [REST pagination](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api).
- [GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).
- [Reddit research access](https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data): Reddit is disabled and no Reddit research authorization is presumed.
