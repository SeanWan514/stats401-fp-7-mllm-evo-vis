"""Build compact, documented interim-check-in data from OpenVLM.json.

The raw file is retained unchanged. This script extracts the model metadata and
the six benchmark-level scores used by the D3 prototype, normalizes a small set
of recurring labels, and records data coverage for the website.
"""

from __future__ import annotations

import json
import math
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = PROJECT_ROOT / "data" / "OpenVLM.json"
OUTPUT_PATH = PROJECT_ROOT / "data" / "interim_models.json"

METRICS = [
    {
        "id": "mmmu",
        "label": "MMMU validation overall",
        "benchmark": "MMMU_VAL",
        "field": "Overall",
        "unit": "score",
    },
    {
        "id": "mathvista",
        "label": "MathVista overall",
        "benchmark": "MathVista",
        "field": "Overall",
        "unit": "score",
    },
    {
        "id": "mmbench",
        "label": "MMBench EN v1.1 overall",
        "benchmark": "MMBench_TEST_EN_V11",
        "field": "Overall",
        "unit": "score",
    },
    {
        "id": "mmvet",
        "label": "MM-Vet overall",
        "benchmark": "MMVet",
        "field": "Overall",
        "unit": "score",
    },
    {
        "id": "hallusion",
        "label": "HallusionBench overall",
        "benchmark": "HallusionBench",
        "field": "Overall",
        "unit": "score",
    },
    {
        "id": "ocrbench",
        "label": "OCRBench final score",
        "benchmark": "OCRBench",
        "field": "Final Score",
        "unit": "points",
    },
]


def clean_text(value: object) -> str:
    text = str(value or "").strip()
    replacements = {
        "<br>": " + ",
        "�C": "-",
        "�": "",
        "\u2013": "-",
        "Sensetime": "SenseTime",
        "HuggingFace": "Hugging Face",
        "University of Wisconsin-Madison": "University of Wisconsin-Madison",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return re.sub(r"\s+", " ", text).strip()


def normalize_org(value: object) -> str:
    text = clean_text(value)
    aliases = {
        "Shanghai AI Laboratory & SenseTime & Tsinghua University": "Shanghai AI Lab consortium",
        "Shanghai AI Laboratory & Tsinghua University": "Shanghai AI Lab consortium",
        "Shanghai AI Laboratory": "Shanghai AI Laboratory",
        "University of Wisconsin-Madison": "University of Wisconsin-Madison",
    }
    return aliases.get(text, text or "Unknown")


def parse_date(value: object) -> str | None:
    text = clean_text(value)
    for fmt in ("%Y/%m/%d", "%Y/%m/%d %H:%M:%S"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            pass
    return None


def parse_parameters_billions(value: object) -> float | None:
    text = clean_text(value).replace(",", "")
    match = re.fullmatch(r"([0-9]+(?:\.[0-9]+)?)B", text, flags=re.IGNORECASE)
    return float(match.group(1)) if match else None


def language_family(value: object) -> str:
    text = clean_text(value).lower()
    tests = [
        ("Qwen", ("qwen",)),
        ("Llama and Vicuna", ("llama", "vicuna", "alpaca")),
        ("InternLM", ("internlm",)),
        ("Gemma", ("gemma",)),
        ("Phi", ("phi",)),
        ("Mistral and Mixtral", ("mistral", "mixtral")),
        ("DeepSeek", ("deepseek", "deekseek")),
        ("Yi", ("yi-", "nous-hermes-2-yi")),
        ("GLM", ("glm",)),
    ]
    for label, tokens in tests:
        if any(token in text for token in tokens):
            return label
    return "Other or undisclosed"


def vision_family(value: object) -> str:
    text = clean_text(value).lower()
    tests = [
        ("SigLIP", ("siglip",)),
        ("CLIP", ("clip",)),
        ("InternViT", ("internvit",)),
        ("EVA", ("eva",)),
        ("QwenViT", ("qwenvit",)),
        ("AIMv2", ("aimv2",)),
        ("SAM", ("sam",)),
        ("ConvNeXT", ("convnext",)),
    ]
    for label, tokens in tests:
        if any(token in text for token in tokens):
            return label
    return "Other or undisclosed"


def model_family(name: str) -> str:
    lowered = name.lower()
    families = [
        ("InternVL", "internvl"),
        ("LLaVA", "llava"),
        ("Qwen-VL", "qwen"),
        ("MiniCPM-V", "minicpm"),
        ("Idefics", "idefics"),
        ("PaliGemma", "paligemma"),
        ("CogVLM", "cogvlm"),
        ("DeepSeek-VL", "deepseek"),
        ("Gemini", "gemini"),
        ("GPT-4V family", "gpt-4"),
        ("Claude", "claude"),
        ("Molmo", "molmo"),
        ("Phi Vision", "phi"),
        ("mPLUG", "mplug"),
        ("MiniGPT", "minigpt"),
    ]
    for label, token in families:
        if token in lowered:
            return label
    base = re.split(r"[-_ (]", name, maxsplit=1)[0]
    return base[:24] if base else "Other"


def score_from(record: dict, metric: dict) -> float | None:
    value = record.get(metric["benchmark"], {}).get(metric["field"])
    if isinstance(value, (int, float)) and math.isfinite(value):
        return float(value)
    return None


def main() -> None:
    source = json.loads(RAW_PATH.read_text(encoding="utf-8"))
    raw_results = source["results"]
    numeric_measurements = 0
    benchmark_blocks = 0
    models = []

    for name, record in raw_results.items():
        meta = record.get("META", {})
        for key, benchmark in record.items():
            if key == "META" or not isinstance(benchmark, dict):
                continue
            benchmark_blocks += 1
            numeric_measurements += sum(isinstance(v, (int, float)) for v in benchmark.values())

        release_date = parse_date(meta.get("Time"))
        params = parse_parameters_billions(meta.get("Parameters"))
        method = meta.get("Method") or [name, ""]
        method_url = method[1] if isinstance(method, list) and len(method) > 1 else ""
        scores = {metric["id"]: score_from(record, metric) for metric in METRICS}

        models.append(
            {
                "id": clean_text(meta.get("dir_name") or name),
                "name": clean_text(method[0] if isinstance(method, list) and method else name),
                "url": clean_text(method_url),
                "release_date": release_date,
                "organization": normalize_org(meta.get("Org")),
                "parameters_label": clean_text(meta.get("Parameters")) or "Not reported",
                "parameters_b": params,
                "language_model": clean_text(meta.get("Language Model")) or "Not reported",
                "language_family": language_family(meta.get("Language Model")),
                "vision_model": clean_text(meta.get("Vision Model")) or "Not reported",
                "vision_family": vision_family(meta.get("Vision Model")),
                "model_family": model_family(name),
                "open_weight": clean_text(meta.get("OpenSource")).lower() == "yes",
                "verified": clean_text(meta.get("Verified")).lower() == "yes",
                "scores": scores,
                "score_count": sum(value is not None for value in scores.values()),
            }
        )

    models.sort(key=lambda item: (item["release_date"] or "9999", item["name"]))
    org_counts = Counter(model["organization"] for model in models)
    top_orgs = [name for name, _ in org_counts.most_common(7)]
    for model in models:
        model["organization_group"] = (
            model["organization"] if model["organization"] in top_orgs else "Other providers"
        )

    link_counts: dict[tuple[str, str], int] = defaultdict(int)
    for model in models:
        if model["organization_group"] == "Other providers":
            continue
        link_counts[(model["organization_group"], model["model_family"])] += 1
    strongest_links = sorted(link_counts.items(), key=lambda item: item[1], reverse=True)[:48]
    active_families = Counter(family for (_, family), count in strongest_links for _ in range(count))
    selected_families = {family for family, _ in active_families.most_common(12)}
    strongest_links = [item for item in strongest_links if item[0][1] in selected_families]
    network = {
        "nodes": [
            *[{"id": org, "label": org, "type": "provider", "count": org_counts[org]} for org in top_orgs],
            *[
                {"id": f"family::{family}", "label": family, "type": "family", "count": count}
                for family, count in active_families.most_common(12)
            ],
        ],
        "links": [
            {"source": org, "target": f"family::{family}", "count": count}
            for (org, family), count in strongest_links
        ],
    }

    dated = [model for model in models if model["release_date"]]
    snapshot_text = str(source.get("time") or "")
    snapshot_date = None
    if len(snapshot_text) >= 8 and snapshot_text[:8].isdigit():
        snapshot_date = datetime.strptime(snapshot_text[:8], "%Y%m%d").date().isoformat()
    after_snapshot = [
        {"name": model["name"], "release_date": model["release_date"]}
        for model in dated
        if snapshot_date and model["release_date"] > snapshot_date
    ]
    profile = {
        "snapshot": source.get("time"),
        "snapshot_date": snapshot_date,
        "model_records": len(models),
        "benchmark_blocks": benchmark_blocks,
        "numeric_measurements": numeric_measurements,
        "open_weight_models": sum(model["open_weight"] for model in models),
        "known_parameters": sum(model["parameters_b"] is not None for model in models),
        "known_language_models": sum(model["language_model"] != "Not reported" for model in models),
        "known_vision_models": sum(model["vision_model"] != "Not reported" for model in models),
        "date_min": min(model["release_date"] for model in dated),
        "date_max": max(model["release_date"] for model in dated),
        "records_after_snapshot": after_snapshot,
        "top_organizations": org_counts.most_common(10),
    }

    payload = {
        "generated_from": "OpenVLM.json",
        "profile": profile,
        "metrics": METRICS,
        "organization_groups": [*top_orgs, "Other providers"],
        "models": models,
        "network": network,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH} with {len(models)} models")
    print(json.dumps(profile, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
