"""Filter independently authored feedback and add transparent rule baselines.

These labels are unvalidated machine suggestions, never human ground truth.
No sentence splitting, synthetic texts, or family-to-model copying is used.
"""
from __future__ import annotations

import argparse
import collections
import csv
import hashlib
import html
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TASKS = [
    ("visual-qa", "Visual question answering", "Answer questions grounded in images.", ["visual question", "vqa", "image question", "question answering", "视觉问答"], ["mmbench", "mmvet", "hallusion"], "MMBench/MM-Vet provide general visual QA evidence; HallusionBench is specifically hallucination-related. Settings must match."),
    ("ocr", "OCR and text extraction", "Read or extract text visible in an image.", ["ocr", "ocrbench", "text recognition", "text extraction", "read text", "textvqa", "文字识别", "识别文字"], ["ocrbench"], "OCRBench measures a mixture of recognition and reasoning; it is task evidence, not a direct measure of every OCR workflow."),
    ("document-understanding", "Document understanding", "Read and answer questions about document pages and layouts.", ["document", "docvqa", "pdf", "invoice", "receipt", "文档", "票据"], ["docvqa"], "DocVQA is evidence for document QA, not all document processing."),
    ("chart-understanding", "Chart and table understanding", "Extract or reason about information in charts or visual tables.", ["chart", "plot", "table extraction", "chartqa", "图表", "表格"], ["chartqa"], "ChartQA supports chart understanding; it does not measure every table workflow."),
    ("visual-reasoning", "Visual and mathematical reasoning", "Reason over visual evidence, spatial relations, diagrams, or math.", ["visual reasoning", "mathematical reasoning", "logical reasoning", "mathvista", "mathvision", "geometry", "spatial reasoning", "counting", "数学", "视觉推理", "逻辑推理", "空间推理", "图像推理", "推理"], ["mmmu", "mathvista", "mmvet"], "Benchmarks differ in domain and protocol; never pool raw scores. The Chinese reasoning/inference term is a candidate: capability/math/logic/visual contexts assign reasoning; speed/memory/deployment/error-only contexts are runtime. Ambiguous usage stays a candidate."),
    ("image-captioning", "Image description", "Generate grounded descriptions of images.", ["caption", "captioning", "describe the image", "image description", "describe images", "图像描述", "图片描述"], [], "No direct caption benchmark is in the current score table; leave quantitative task evidence missing."),
    ("multimodal-conversation", "Multimodal conversation", "Follow instructions or maintain dialogue grounded in images.", ["multi-turn", "multiturn", "conversation", "chatting", "多轮", "图文对话", "多模态对话"], [], "No single general benchmark is treated as a direct measure of conversation quality. A chat template is a setup detail, not task evidence."),
    ("video-understanding", "Video understanding", "Answer questions about video frames and temporal events; adjacent to the image-and-text scope.", ["video", "temporal", "视频"], [], "Video-only feedback is excluded; image/video combined feedback can retain this secondary tag."),
]
ASPECTS = {
    "accuracy": r"\b(?:accuracy|accurate|incorrect|correct|wrong|hallucinat\w*|recogniz\w*|quality)\b|准确|幻觉|识别错误",
    "latency": r"\b(?:slow|fast|latency|speed|tokens.?/s|throughput)\b|速度|延迟|慢",
    "memory": r"\b(?:memory|vram|oom|cuda out|out of memory|gpu|ram)\b|显存|内存",
    "reliability": r"\b(?:crash\w*|error|fail\w*|broken|bug|work\w*|exception|nan)\b|报错|崩溃|失败",
    "setup": r"\b(?:install\w*|config\w*|dependency|dependencies|transformers|vllm|deploy\w*|quantiz\w*|gguf|fine.?tun\w*|inference|chat template|load\w*|train\w*)\b|安装|部署|微调|量化|加载|训练|推理|依赖|参数|环境",
    "instruction-following": r"\b(?:instruction|prompt|format|json|follow\w*)\b|指令|格式",
    "licensing": r"\b(?:license|commercial|copyright|permission)\b|商用|许可证",
}
POSITIVE = {"accurate", "correct", "fast", "great", "excellent", "helpful", "reliable", "good", "better", "improved", "works", "working", "successful", "success", "useful", "impressive", "resolved", "fixed"}
NEGATIVE = {"wrong", "incorrect", "inaccurate", "slow", "broken", "bad", "worse", "fails", "failed", "failure", "crash", "crashes", "error", "errors", "hallucination", "hallucinations", "unstable", "useless", "unusable", "problem", "issue"}
NEGATIONS = {"not", "no", "never", "neither", "cannot", "can't", "isn't", "isnt", "doesn't", "doesnt", "don't", "dont", "without", "wasn't", "wasnt", "unable"}


def authored_text(text):
    # Email clients append another person's complete message without Markdown
    # quote markers. Never count or label that inherited text as a new opinion.
    markers = r"(?im)^\s*(?:[-_]+\s*(?:原始邮件|Original Message)|(?:原始邮件|Original Message)\s*[-_:：]|On .{5,200} wrote:|在.{5,200}写道[:：]|Reply to this email directly).*$"
    text = re.split(markers, text, maxsplit=1)[0]
    text = re.sub(r"(?im)^\s*(?:发自我的\s*(?:iPhone|iPad|手机)|Sent from my (?:iPhone|iPad|Android)).*$", "", text)
    return text.strip()


def analyze_text(text):
    text = authored_text(text)
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    text = re.sub(r"(?m)^\s*>.*$", " ", text)
    text = re.sub(r"(?m)^\s*#{1,6}\s+.*$", " ", text)
    text = re.sub(r"(?im)^\s*(?:Issue:|Command:|Log:|Screenshots:.*|_No response_|PASTE THE (?:COMMANDS|LOGS) HERE\.?)\s*$", " ", text)
    text = re.sub(r"(?m)^\s*(?:from \S+ import .*|import \S.*|def \w+.*|class \w+.*|File \".*|Traceback .*|[-*] \[[ xX]\].*)$", " ", text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def redact(text):
    text = re.sub(r"\b(?:hf_|ghp_|github_pat_)[A-Za-z0-9_]{15,}\b", "[REDACTED_TOKEN]", text)
    return re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[REDACTED_EMAIL]", text)


def polarity(text):
    # Clause-local window prevents distant negations from flipping unrelated words.
    positive, negative, evidence = 0, 0, []
    for clause in re.split(r"[.!?;。！？；\n]|\b(?:but|however|although)\b", text.lower()):
        words = re.findall(r"[a-z]+(?:'[a-z]+)?", clause)
        for i, word in enumerate(words):
            score = 1 if word in POSITIVE else -1 if word in NEGATIVE else 0
            if not score:
                continue
            before = words[max(0, i-3):i]
            negated = any(v in NEGATIONS for v in before)
            if negated:
                score *= -1
            positive += score > 0
            negative += score < 0
            evidence.append({"term": word, "negated": negated, "polarity": "positive" if score > 0 else "negative"})
    chinese_terms = {"准确": 1, "清晰": 1, "流畅": 1, "稳定": 1, "好用": 1, "有用": 1,
                     "很快": 1, "很慢": -1, "慢": -1, "错误": -1, "幻觉": -1, "失败": -1, "崩溃": -1}
    pattern = "|".join(re.escape(t) for t in sorted(chinese_terms, key=len, reverse=True))
    for match in re.finditer(pattern, text):
        term = match.group()
        prefix = text[max(0, match.start()-4):match.start()]
        negated = bool(re.search(r"(?:不|没|没有|并非|不是|无)(?:太|够|再|很)?$", prefix))
        score = chinese_terms[term] * (-1 if negated else 1)
        positive += score > 0
        negative += score < 0
        evidence.append({"term": term, "negated": negated, "polarity": "positive" if score > 0 else "negative"})
    label = "mixed" if positive and negative else "positive" if positive else "negative" if negative else "unknown"
    return {"label": label, "confidence": 0.55 if label != "unknown" else 0.0, "evidence": evidence[:20]}


def language(text):
    chinese = len(re.findall(r"[\u4e00-\u9fff]", text))
    latin = len(re.findall(r"[A-Za-z]", text))
    if chinese >= 8:
        return "zh" if chinese >= latin / 3 else "mixed"
    return "en" if latin >= 20 else "unknown"


def classify(row, model_crosswalk):
    text = analyze_text(row["text"])
    lower = text.lower()
    reasoning_clauses = [c for c in re.split(r"[。！？.!?;；]", lower) if "推理" in c]
    capability = any(re.search(r"(?:数学|图表|逻辑|视觉|空间|图像|多步|链式|因果|常识|复杂|抽象).{0,6}推理|推理.{0,8}(?:能力|质量|准确|正确|过程|思路|推理链|很强|很差|很好|不错|更强)", c) for c in reasoning_clauses)
    runtime_only = bool(reasoning_clauses) and not capability and any(re.search(r"速度|时间|显存|内存|部署|报错|耗时|延迟|框架|服务|引擎|吞吐|运行|加载|cuda|vllm|gpu|inference|latency|memory", c) for c in reasoning_clauses)
    reasoning_resolution = "capability" if capability else "runtime" if runtime_only else "ambiguous" if reasoning_clauses else "absent"
    def matched(term):
        if term == "推理":
            return capability
        if re.search(r"[\u4e00-\u9fff]", term):
            return term in lower
        return re.search(r"\b" + re.escape(term) + r"s?\b", lower) is not None
    task_ids = [tid for tid, _, _, terms, _, _ in TASKS if any(matched(term) for term in terms)]
    aspects = []
    sentences = re.split(r"(?<=[.!?。！？])\s+|\n|\b(?:but|however|although|yet)\b|但是|不过|然而|可是|但", text, flags=re.I)
    for aspect, pattern in ASPECTS.items():
        snippets = [s for s in sentences if re.search(pattern, s, flags=re.I)]
        if snippets:
            pol = polarity(" ".join(snippets))
            aspects.append({"aspect": aspect, "polarity": pol["label"], "confidence": pol["confidence"], "evidence": snippets[0][:240]})
    sentiment = polarity(text)
    if re.search(r"\b(?:error|exception|traceback|failed|crash|not work|doesn't work|does not work|encountered|nan)\b|报错|错误|失败|不能运行|不兼容|没有解决|遇到.{0,12}问题", lower):
        experience = "problem_report"
    elif "?" in text or "？" in text or re.search(r"\b(?:how (?:to|can|do)|is it possible|could you|can you|what is|what are)\b|请问|怎么|如何|是否|想问", lower):
        experience = "usage_question"
    elif re.search(r"\b(?:i tried|i tested|i have|we tested|works|working|my experience|inference|fine.?tun|solved|resolved|completed|running)\b|测试|体验|使用|正常|解决了", lower):
        experience = "usage_observation"
    elif re.search(r"\b(?:feature|support|request|would like)\b|希望|支持", lower):
        experience = "feature_request"
    else:
        experience = "community_discussion"
    exact = row["scope"] == "model"
    conflicts = []
    if exact:
        owner, repository = row["source_repo"].split("/", 1)
        prefix = re.match(r"[a-z]+", repository.lower()).group()
        mentions = re.findall(r"(?i)\b" + re.escape(owner) + r"/([A-Za-z0-9_.-]+)", authored_text(row["text"]))
        conflicts = sorted({owner + "/" + name.rstrip(".") for name in mentions
                            if name.lower().rstrip(".") != repository.lower()
                            and name.lower().startswith(prefix) and re.search(r"\d", name)})
        if conflicts:
            exact = False
    return {"id": row["platform"] + ":" + row["object_type"] + ":" + row["source_object_id"],
            **{k: row.get(k) for k in ("platform", "source_object_id", "thread_id", "source_url", "published_at", "collected_at", "text", "role", "object_type", "author_hash")},
            "source_repo": row["source_repo"], "language": language(text), "family_id": row["family_id"],
            "text": redact(authored_text(row["text"])),
            "model_ids": [model_crosswalk[r] for r in row["model_ids"] if r in model_crosswalk] if exact else [],
            "model_repo_ids": row["model_ids"] if exact else [], "attribution_level": "model" if exact else "family",
            "source_model_repo_id": row["source_repo"] if row["scope"] == "model" else None,
            "mentioned_model_repo_ids": conflicts,
            "attribution_confidence": 0.35 if conflicts else 0.75 if exact else 0.7,
            "attribution_evidence": {"type": "conflicting_model_mentions" if conflicts else "model_repository_context" if exact else "family_repository_context", "url": row["source_evidence_url"], "note": "Other model variants are explicitly mentioned; exact attribution withheld." if conflicts else "Repository context establishes association, not proof the author tested every model/version."},
            "task_ids": task_ids, "aspects": aspects, "sentiment": sentiment["label"],
            "task_candidates": ["visual-reasoning"] if reasoning_clauses and not capability and not runtime_only else [],
            "reasoning_term_resolution": reasoning_resolution,
            "sentiment_confidence": sentiment["confidence"], "sentiment_evidence": sentiment["evidence"],
            "evaluative_status": "evaluative" if sentiment["label"] != "unknown" else "non_evaluative" if experience == "usage_question" else "unknown",
            "experience_type": experience, "label_method": "transparent_rules_v1",
            "validation_status": "pending_human_review", "label_confidence": 0.55 if task_ids else 0.0,
            "eligible": True}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--report-name", default="feedback_quality")
    args = p.parse_args()
    all_rows = []
    model_config = ROOT / "config/canonical_models.json"
    model_crosswalk = {r["repo_id"]: r["id"] for r in json.loads(model_config.read_text())["models"]} if model_config.exists() else {}
    for file in sorted((ROOT / "data/raw/feedback/normalized").glob("*.jsonl")):
        # Unicode U+2028/U+0085 can occur inside JSON strings: split only LF.
        for line in file.read_text().split("\n"):
            if line.strip():
                all_rows.append(json.loads(line))
    counts = collections.Counter()
    accepted = []
    seen_ids, seen_long_text = set(), set()
    exclusions = []
    for row in sorted(all_rows, key=lambda r: (r.get("published_at") or "", r["source_object_id"])):
        rid = (row["platform"], row["object_type"], row["source_object_id"])
        text = analyze_text(row["text"])
        norm = re.sub(r"\s+", " ", text.lower()).strip()
        # Same author + long normalized text only. Independent short same-word
        # observations must not be merged across users or sources.
        duplicate_key = (row.get("author_hash"), norm)
        reason = None
        if rid in seen_ids:
            reason = "duplicate_source_object"
        elif row.get("is_pull_request"):
            reason = "pull_request"
        elif not row.get("thread_resolved"):
            reason = "unresolved_thread_type"
        elif row["role"] in {"bot", "maintainer"}:
            reason = row["role"]
        elif len(re.findall(r"[A-Za-z\u4e00-\u9fff]", text)) < 25 and len(re.findall(r"[\u4e00-\u9fff]", text)) < 12:
            reason = "insufficient_substantive_text"
        elif re.search(r"listed on openmodelmap|internal model structure here|model discovery engine", norm):
            reason = "directory_promotion"
        elif re.search(r"python-template|repository template|repo template|github actions workflow", row["text"], flags=re.I) and not re.search(r"\b(?:inference|prediction|image|vision|performance)\b|图像|视觉|推理", norm):
            reason = "repository_administration"
        elif re.fullmatch(r"[\W_]*(?:thanks?(?: you)?|thank you very much|great|nice|awesome|following|same (?:here|issue)|bump)[\W_]*", norm):
            reason = "acknowledgement_only"
        elif re.search(r"\b(?:thank|thanks|tnx|thx|got it)\b|谢谢|感谢", norm) and len(norm) < 130 and not re.search(r"\b(?:model|work\w*|error|issue|problem|fix\w*|solv\w*|run\w*|train\w*|gpu|image|result|code|inference|memory|support)\b|模型|错误|问题|运行|推理|训练|图片|显存|代码", norm):
            reason = "acknowledgement_only"
        elif re.search(r"\b(?:audio|speech|tts|asr)\b", norm) and not re.search(r"\b(?:image|vision|visual|video|vlm|ocr|multimodal)\b", norm) and row["family_id"] == "minicpm-v":
            reason = "audio_only_topic"
        elif re.search(r"\bvideo\b|视频", norm) and not re.search(r"\b(?:image|picture|photo|vision|visual|ocr|multimodal)\b|图像|图片|照片|图文", norm):
            reason = "video_only_topic"
        elif len(norm) >= 160 and row.get("author_hash") and duplicate_key in seen_long_text:
            reason = "same_author_exact_long_text"
        seen_ids.add(rid)
        if reason:
            counts[reason] += 1
            exclusions.append({"platform": row["platform"], "source_object_id": row["source_object_id"], "reason": reason})
            continue
        if len(norm) >= 160:
            seen_long_text.add(duplicate_key)
        processed = classify(row, model_crosswalk)
        use_signal = re.search(r"\b(?:model|image|vision|visual|prediction|output|result|weight|token|dataset|benchmark|reproduce|loss|accuracy|generation|checkpoint)\b|模型|图像|图片|识别|结果|输出|权重|数据集|复现|生成|损失", norm)
        if processed["experience_type"] == "community_discussion" and not processed["task_ids"] and not processed["aspects"] and not use_signal:
            reason = "no_task_aspect_or_use_signal"
            counts[reason] += 1
            exclusions.append({"platform": row["platform"], "source_object_id": row["source_object_id"], "reason": reason})
            continue
        if not processed["aspects"] and not processed["task_ids"] and re.search(r"\b(?:close (?:this|the) issue|join (?:our|my)|job opening|hiring|contact me|subscribe to|send me (?:an )?email)\b|招聘|合作联系|关闭这个issue", norm):
            reason = "administrative_or_promotional_topic"
            counts[reason] += 1
            exclusions.append({"platform": row["platform"], "source_object_id": row["source_object_id"], "reason": reason})
            continue
        accepted.append(processed)
    output = ROOT / "data/final/feedback.jsonl"
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(".jsonl.tmp")
    temporary.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in accepted))
    temporary.replace(output)
    task_table = {"schema_version": "1.0", "tasks": [dict(id=i, label=l, definition=d, inclusion_rules=terms, benchmark_ids=b, mapping_rationale=m) for i,l,d,terms,b,m in TASKS]}
    (ROOT / "data/final/tasks.json").write_text(json.dumps(task_table, ensure_ascii=False, indent=2) + "\n")
    summary = {"schema_version": "1.0", "raw_objects": len(all_rows), "accepted_unique_objects": len(accepted),
               "raw_unique_source_objects": len(seen_ids),
               "target": 10000, "shortfall": max(0, 10000-len(accepted)), "exclusions": dict(counts),
               "platforms": dict(collections.Counter(r["platform"] for r in accepted)),
               "families": dict(collections.Counter(r["family_id"] for r in accepted)),
               "roles": dict(collections.Counter(r["role"] for r in accepted)),
               "attribution_levels": dict(collections.Counter(r["attribution_level"] for r in accepted)),
               "conflicting_model_mentions": sum(bool(r["mentioned_model_repo_ids"]) for r in accepted),
               "canonical_model_mapped_objects": sum(bool(r["model_ids"]) for r in accepted),
               "experience_types": dict(collections.Counter(r["experience_type"] for r in accepted)),
               "tasks": dict(collections.Counter(t for r in accepted for t in r["task_ids"])),
               "unclassified_task_count": sum(not r["task_ids"] for r in accepted),
               "primary_image_task_labeled_objects": sum(any(t != "video-understanding" for t in r["task_ids"]) for r in accepted),
               "chinese_reasoning_resolution": dict(collections.Counter(r["reasoning_term_resolution"] for r in accepted)),
               "sentiment": dict(collections.Counter(r["sentiment"] for r in accepted)),
               "evaluative_status": dict(collections.Counter(r["evaluative_status"] for r in accepted)),
               "label_method": "transparent_rules_v1", "human_validated_count": 0,
               "validation_status": "Sean review not yet completed", "sentiment_accuracy": None,
               "notes": ["Independent source objects; no sentence splitting or family-to-model replication.", "Labels and task relevance are rule-based suggestions, not validated user-study findings.", "Specialized model-family repository context supplies association; task IDs require direct text matches.", "No fuzzy deduplication: exact source IDs and same-author long exact texts only."]}
    (ROOT / "reports" / f"{args.report_name}.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n")
    (ROOT / "reports/feedback_exclusions.jsonl").write_text("".join(json.dumps(r)+"\n" for r in exclusions))
    # Stratify across platform × family × sentiment using round-robin bins.
    rng = random.Random(401)
    groups = collections.defaultdict(list)
    for row in accepted:
        groups[(row["platform"], row["family_id"], row["sentiment"])].append(row)
    for values in groups.values():
        rng.shuffle(values)
    sample = []
    while len(sample) < min(250, len(accepted)) and groups:
        for key in list(groups):
            sample.append(groups[key].pop())
            if not groups[key]:
                del groups[key]
            if len(sample) >= min(250, len(accepted)):
                break
    with (ROOT / "reports/feedback_annotation_250.csv").open("w", newline="", encoding="utf-8-sig") as f:
        fields = ["id", "source_url", "platform", "family_id", "text", "suggested_task_ids", "suggested_sentiment", "human_relevant", "human_task_ids", "human_sentiment", "human_aspects", "reviewer", "review_notes"]
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for row in sample:
            writer.writerow({**{k: row[k] for k in ["id", "source_url", "platform", "family_id", "text"]}, "suggested_task_ids": ";".join(row["task_ids"]), "suggested_sentiment": row["sentiment"]})
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
