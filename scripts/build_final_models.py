#!/usr/bin/env python3
"""Fetch official metadata/cards and reproducibly build the canonical evidence tables.

Use system Python on macOS if a separately installed Python lacks CA certificates.
No model weights are fetched. Build without --fetch for a fully offline rebuild.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import csv
import datetime as dt
import gzip
import hashlib
import html
import json
import math
import re
import shutil
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/model_cards"
FINAL = ROOT / "data/final"
REPORTS = ROOT / "reports"
CONFIG = ROOT / "config/canonical_models.json"

BENCH_FIELDS = ["result_id", "model_id", "canonical_model_id", "is_canonical", "benchmark_id",
                "benchmark", "benchmark_version", "split", "metric", "unit", "setting_id", "score",
                "source_url", "source_type", "source_pointer", "comparability_group", "comparability_status",
                "normalization_min", "normalization_max", "higher_is_better", "is_primary_metric",
                "visualization_eligible", "source_label", "notes"]
METRICS = [
    {"id": "mmmu", "label": "MMMU validation", "benchmark": "MMMU_VAL", "field": "Overall", "unit": "percent", "range_min": 0, "range_max": 100, "higher_is_better": True,
     "definition_url": "https://github.com/MMMU-Benchmark/MMMU"},
    {"id": "mathvista", "label": "MathVista", "benchmark": "MathVista", "field": "Overall", "unit": "percent", "range_min": 0, "range_max": 100, "higher_is_better": True,
     "definition_url": "https://github.com/lupantech/MathVista"},
    {"id": "mmbench", "label": "MMBench EN v1.1", "benchmark": "MMBench_TEST_EN_V11", "field": "Overall", "unit": "percent", "range_min": 0, "range_max": 100, "higher_is_better": True,
     "definition_url": "https://github.com/open-compass/VLMEvalKit/blob/main/vlmeval/dataset/image_mcq.py"},
    {"id": "mmvet", "label": "MM-Vet", "benchmark": "MMVet", "field": "Overall", "unit": "percent", "range_min": 0, "range_max": 100, "higher_is_better": True,
     "definition_url": "https://github.com/yuweihao/MM-Vet"},
    {"id": "hallusion", "label": "HallusionBench", "benchmark": "HallusionBench", "field": "Overall", "unit": "percent", "range_min": 0, "range_max": 100, "higher_is_better": True,
     "definition_url": "https://github.com/tianyi-lab/HallusionBench", "caveat": "The baseline Overall / Qwen HallBench avg aggregation formula is unspecified; it is not relabeled as aAcc, fAcc or qAcc."},
    {"id": "ocrbench", "label": "OCRBench v1", "benchmark": "OCRBench", "field": "Final Score", "unit": "points", "range_min": 0, "range_max": 1000, "higher_is_better": True,
     "definition_url": "https://github.com/Yuliang-Liu/MultimodalOCR/tree/main/OCRBench", "caveat": "OCRBench v2 and undocumented percent-scale variants must not use this range."},
    {"id": "chartqa", "label": "ChartQA", "benchmark": "ChartQA", "field": "reported_score", "unit": "percent", "range_min": 0, "range_max": 100, "higher_is_better": True,
     "definition_url": "https://github.com/vis-nlp/ChartQA", "caveat": "Standard metric is relaxed accuracy; model-card rows that omit the metric retain reported_score."},
    {"id": "docvqa", "label": "DocVQA", "benchmark": "DocVQA", "field": "reported_score", "unit": "percent", "range_min": 0, "range_max": 100, "higher_is_better": True,
     "definition_url": "https://github.com/open-compass/VLMEvalKit/blob/main/vlmeval/dataset/image_vqa.py", "caveat": "Standard metric is ANLS; model-card rows that omit the metric retain reported_score; val and test remain separate."},
]
METRIC_BY_ID = {m["id"]: m for m in METRICS}


def clean_cell(value):
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    value = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", value)
    value = re.sub(r"<[^>]+>", " ", value)
    return " ".join(html.unescape(value).replace("**", "").replace("`", "").split()).strip()


def alias_key(value):
    return re.sub(r"[^a-z0-9]", "", clean_cell(value).replace("(this model)", "").lower())


def numeric_cell(value):
    value = clean_cell(value).strip("* ")
    if re.fullmatch(r"\d+(?:\.\d+)?%?", value):
        return float(value.rstrip("%"))
    return None


def markdown_tables(text):
    lines = text.splitlines()
    i = 0
    while i < len(lines) - 1:
        if lines[i].lstrip().startswith("|") and re.match(r"^\s*\|[\s:|\-]+\|?\s*$", lines[i + 1]):
            start = i + 1
            table = [[clean_cell(c) for c in lines[i].strip().strip("|").split("|")]]
            i += 2
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                table.append([clean_cell(c) for c in lines[i].strip().strip("|").split("|")])
                i += 1
            yield "markdown-line-" + str(start), table
        else:
            i += 1


class TableParser(HTMLParser):
    """Read simple HTML tables; colspan rows are padded and ignored unless aligned."""
    def __init__(self):
        super().__init__()
        self.tables, self.table, self.row, self.cell = [], None, None, None
        self.span = 1

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.table = []
        elif tag == "tr" and self.table is not None:
            self.row = []
        elif tag in ("td", "th") and self.row is not None:
            self.cell = []
            self.span = int(dict(attrs).get("colspan", "1"))
        elif tag == "br" and self.cell is not None:
            self.cell.append(" ")

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            self.row.append(" ".join("".join(self.cell).split()))
            self.row.extend([""] * (self.span - 1))
            self.cell = None
        elif tag == "tr" and self.row is not None:
            self.table.append(self.row)
            self.row = None
        elif tag == "table" and self.table is not None:
            self.tables.append(self.table)
            self.table = None

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)


def card_benchmark(label, source_id):
    """Interpret explicit table labels; never guess unknown benchmark versions/splits."""
    norm = alias_key(label)
    mid = None
    if norm.startswith("mmmupro"):
        return None
    for prefix, key in [("mmmu", "mmmu"), ("mathvista", "mathvista"), ("mmbench", "mmbench"),
                        ("mmb11", "mmbench"), ("mmvet", "mmvet"), ("hallusionbench", "hallusion"),
                        ("hallbench", "hallusion"), ("ocrbench", "ocrbench"), ("chartqa", "chartqa"), ("docvqa", "docvqa")]:
        if norm.startswith(prefix):
            mid = key
            break
    if mid is None or "pro" in norm or (mid == "mmvet" and "v2" in norm) or (mid == "mmbench" and "video" in norm):
        return None
    spec = METRIC_BY_ID[mid]
    version, split, metric, unit, maximum = "unknown", "unknown", "reported_score", spec["unit"], spec["range_max"]
    if "testmini" in norm or "mini" in norm and mid == "mathvista":
        split = "testmini"
    elif "val" in norm:
        split = "validation"
    elif "test" in norm:
        split = "test"
    elif "dev" in norm:
        split = "dev"
    if mid == "mmbench":
        version = "1.1" if "11" in norm else "unknown"
        # Do not assume EN when a card simply says MMBench or MMB1.1.
        split += ":EN" if "en" in norm.replace("mmbench", "") else ":CN" if "cn" in norm else ":language_unknown"
    if mid == "hallusion":
        metric = "reported_avg_definition_unknown" if "avg" in norm else "reported_metric_unknown"
    if mid == "ocrbench":
        if "v2" in norm:
            return None
        # The official Qwen cards report v1 1000-point totals. SmolVLM uses an
        # undocumented rescaling; keep those values but don't normalize them.
        if source_id.startswith("qwen-") or source_id.startswith("openbmb-"):
            version, metric, unit, maximum = "1", "total_points", "points", 1000
        else:
            unit, maximum = "unknown", None
    judge = "GPT-4-Turbo" if "gpt4turbo" in norm else "unknown"
    primary = not (mid == "mmbench" and (version != "1.1" or not split.endswith(":EN")))
    if mid == "mmmu" and split != "validation":
        primary = False
    return {"benchmark_id": mid, "benchmark": spec["benchmark"], "benchmark_version": version,
            "split": split, "metric": metric, "unit": unit, "normalization_min": 0 if maximum else None,
            "normalization_max": maximum, "higher_is_better": True, "judge": judge,
            "is_primary_metric": primary, "visualization_eligible": maximum is not None and primary}


def baseline_benchmark(benchmark, field):
    primary = next((m for m in METRICS if m["benchmark"] == benchmark and m["field"] == field), None)
    bid = next((m["id"] for m in METRICS if m["benchmark"] == benchmark), slug(benchmark))
    version = "1.1" if benchmark.endswith("_V11") else "1" if benchmark == "OCRBench" else "unknown"
    split = "validation" if "_VAL" in benchmark else "test" if "_TEST" in benchmark else "unknown"
    if "_EN" in benchmark:
        split += ":EN"
    elif "_CN" in benchmark:
        split += ":CN"
    return {"benchmark_id": bid, "benchmark": benchmark, "benchmark_version": version, "split": split,
            "metric": field, "unit": primary["unit"] if primary else "unknown",
            "normalization_min": primary["range_min"] if primary else None,
            "normalization_max": primary["range_max"] if primary else None,
            "higher_is_better": True if primary else None, "is_primary_metric": bool(primary),
            "visualization_eligible": bool(primary)}


def csv_write(path, fields, rows):
    with path.open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({key: str(value).lower() if isinstance(value, bool) else value for key, value in row.items()})


def leaf_numbers(value, path=()):
    if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value):
        yield path, value
    elif isinstance(value, dict):
        for key, child in value.items():
            yield from leaf_numbers(child, path + (key,))
    elif isinstance(value, list):
        for i, child in enumerate(value):
            yield from leaf_numbers(child, path + (str(i),))


def result_key(row):
    return hashlib.sha256(json.dumps([row.get(k) for k in ["model_id", "benchmark", "metric", "setting_id", "source_url", "source_pointer"]], ensure_ascii=False).encode()).hexdigest()[:24]


def build(config):
    baseline_path = ROOT / "data/OpenVLM.json"
    baseline = json.loads(baseline_path.read_text())
    baseline_url = "https://github.com/seanwan514/stats401-fp-7-mllm-evo-vis/blob/main/data/OpenVLM.json"
    baseline_hash = hashlib.sha256(baseline_path.read_bytes()).hexdigest()
    config_models = config["models"]
    by_baseline = {name: m for m in config_models for name in m.get("baseline_names", [])}
    models, missing_sources, by_alias = [], [], {}
    family_labels = {"qwen-vl": "Qwen-VL", "internvl": "InternVL", "llava": "LLaVA", "minicpm-v": "MiniCPM-V / MiniCPM-o", "molmo": "Molmo", "gemma": "Gemma", "phi-vision": "Phi Vision / Multimodal", "idefics": "Idefics", "deepseek-vl": "DeepSeek-VL", "smolvlm": "SmolVLM"}
    for entry in config_models:
        key, repo = entry["id"], entry["repo_id"]
        api_path, card_path = RAW / (key + ".api.json"), RAW / (key + ".README.md")
        if not api_path.exists():
            raise ValueError("Missing official API metadata: " + repo)
        api = json.loads(api_path.read_text())
        manifest = json.loads((RAW / (key + ".api.json.manifest.json")).read_text())
        if not card_path.exists():
            missing_sources.append(repo)
        card_data = api.get("cardData") or {}
        weight_files = [item["rfilename"] for item in api.get("siblings", []) if re.search(r"\.(safetensors|bin)$", item["rfilename"])]
        total = (api.get("safetensors") or {}).get("total")
        active = {"deepseek-ai/deepseek-vl2-tiny": 1.0, "deepseek-ai/deepseek-vl2-small": 2.8, "deepseek-ai/deepseek-vl2": 4.5}.get(repo)
        release_status = "verified_day" if entry.get("release_date") else "verified_month" if entry.get("release_month") else "unknown"
        record = {"id": key, "name": entry["name"], "family_id": entry["family_id"], "family": family_labels[entry["family_id"]],
                  "publisher": repo.split("/")[0], "repo_ids": [repo], "release_date": entry.get("release_date"),
                  "release_month": entry.get("release_month"), "release_date_scope": entry.get("release_date_scope", "exact_variant"),
                  "release_evidence_url": entry.get("release_evidence_url"), "release_evidence": entry.get("release_evidence"),
                  "release_status": release_status, "after_baseline_snapshot": entry.get("release_date") > config["baseline_snapshot_date"] if entry.get("release_date") else None,
                  "open_weight": bool(weight_files), "open_weight_evidence": "Official repository lists weight files; licenses and gated access restrictions still apply.",
                  "open_weight_evidence_url": "https://huggingface.co/" + repo + "/tree/main",
                  "gated": api.get("gated", False), "license": card_data.get("license") or "unknown",
                  "license_name": card_data.get("license_name"), "license_url": card_data.get("license_link"),
                  "parameters_total_b": round(total / 1e9, 9) if total else None,
                  "parameters_total_source": "Hugging Face API safetensors.total" if total else None,
                  "parameters_active_b": active, "parameters_active_source": "https://huggingface.co/" + repo if active else None,
                  "parameters_nominal_label": entry["name"], "repository_created_at": api.get("createdAt"),
                  "repository_modified_at": api.get("lastModified"), "retrieved_at": manifest["retrieved_at"],
                  "repository_revision": api.get("sha"), "baseline_names": entry.get("baseline_names", []),
                  "model_card_available": card_path.exists(), "source_urls": list(dict.fromkeys(["https://huggingface.co/" + repo, manifest["source_url"]] + ([entry["release_evidence_url"]] if entry.get("release_evidence_url") else []))),
                  "metadata_evidence_path": str(api_path.relative_to(ROOT)), "model_card_evidence_path": str(card_path.relative_to(ROOT)) if card_path.exists() else None}
        models.append(record)
        aliases = [entry["name"], repo] + entry.get("baseline_names", []) + entry.get("table_aliases", [])
        for alias in aliases:
            normalized = alias_key(alias)
            if normalized in by_alias and by_alias[normalized]["id"] != key:
                raise ValueError("Ambiguous curated model alias: " + alias)
            by_alias[normalized] = record
    baseline_models, results, date_anomalies = [], [], []
    for name, block in baseline["results"].items():
        canonical = by_baseline.get(name)
        key = canonical["id"] if canonical else "baseline:" + slug(name) + "-" + hashlib.sha256(name.encode()).hexdigest()[:8]
        meta = block.get("META", {})
        baseline_models.append({"id": key, "baseline_name": name, "canonical_model_id": canonical["id"] if canonical else None,
                                "baseline_metadata": meta, "baseline_recorded_date": meta.get("Time"),
                                "release_status": "baseline_date_unverified", "source_url": baseline_url})
        date_text = meta.get("Time", "")
        try:
            date = dt.datetime.strptime(date_text, "%Y/%m/%d").date().isoformat()
            if date > config["baseline_snapshot_date"]:
                date_anomalies.append({"model": name, "baseline_recorded_date": date, "snapshot_date": config["baseline_snapshot_date"]})
        except ValueError:
            pass
        for benchmark, measurements in block.items():
            if benchmark == "META":
                continue
            for leaf, score in leaf_numbers(measurements):
                field = "/".join(leaf)
                attributes = baseline_benchmark(benchmark, field)
                row = {"model_id": key, "canonical_model_id": canonical["id"] if canonical else "", "is_canonical": bool(canonical),
                       **attributes, "setting_id": "openvlm-" + baseline["time"] + ":settings_unknown", "score": score,
                       "source_url": baseline_url, "source_type": "openvlm_baseline",
                       "source_pointer": json.dumps(["results", name, benchmark] + list(leaf), ensure_ascii=False),
                       "comparability_group": "baseline:" + benchmark + ":" + field,
                       "comparability_status": "unknown_settings", "source_label": benchmark + "/" + field,
                       "notes": "Original value retained; evaluation configuration and model-card linkage are not independently verified."}
                if not canonical:
                    row["visualization_eligible"] = False
                row["result_id"] = result_key(row)
                results.append(row)
    baseline_count = len(results)
    official_count, rejected_cells = 0, []
    for entry in config_models:
        card_path = RAW / (entry["id"] + ".README.md")
        if not card_path.exists():
            continue
        text = card_path.read_text()
        parser = TableParser()
        parser.feed(text)
        tables = list(markdown_tables(text)) + [("html-table-" + str(i + 1), table) for i, table in enumerate(parser.tables)]
        for locator, table in tables:
            if len(table) < 2:
                continue
            header = table[0]
            if not header:
                continue
            benchmark_rows = alias_key(header[0]) in ("benchmark", "benchmarks", "dataset", "datasets")
            if benchmark_rows:
                observations = [(by_alias.get(alias_key(header[col])), row[0], row[col], i, col)
                                for i, row in enumerate(table[1:], 1) if len(row) == len(header)
                                for col in range(1, len(header))]
            else:
                observations = [(by_alias.get(alias_key(row[0])), header[col], row[col], i, col)
                                for i, row in enumerate(table[1:], 1) if len(row) == len(header) and row
                                for col in range(1, len(header))]
            for model, label, raw_value, rownum, col in observations:
                if not model:
                    continue
                attributes = card_benchmark(label, entry["id"])
                score = numeric_cell(raw_value)
                if attributes is None or score is None:
                    continue
                if attributes["normalization_max"] is not None and not 0 <= score <= attributes["normalization_max"]:
                    rejected_cells.append({"source": entry["id"], "label": label, "value": raw_value, "reason": "outside_verified_range"})
                    attributes.update(normalization_min=None, normalization_max=None, visualization_eligible=False, unit="unknown")
                judge = attributes.pop("judge")
                group = ":".join(["card", entry["id"], locator, attributes["benchmark_id"], attributes["benchmark_version"], attributes["split"], attributes["metric"], "judge=" + judge])
                row = {"model_id": model["id"], "canonical_model_id": model["id"], "is_canonical": True, **attributes,
                       "setting_id": entry["id"] + ":" + locator + ":judge=" + judge,
                       "score": score, "source_url": "https://huggingface.co/" + entry["repo_id"],
                       "source_type": "official_card_self_report" if model["id"] == entry["id"] else "official_card_comparison",
                       "source_pointer": locator + ":row=" + str(rownum) + ":column=" + str(col),
                       "comparability_group": group, "comparability_status": "source_table_only",
                       "source_label": label,
                       "notes": "Same published table; full prompt, image resolution, sampling and evaluation settings unknown. Metric retained as reported when unspecified."}
                row["result_id"] = result_key(row)
                results.append(row)
                official_count += 1
    manual_count = 0
    model_ids = {m["id"] for m in models}
    for observation in config.get("manual_benchmark_observations", []):
        if observation["model_id"] not in model_ids:
            raise ValueError("Unregistered model in visual transcription")
        artifact = ROOT / observation["evidence_path"]
        if not artifact.exists() or hashlib.sha256(artifact.read_bytes()).hexdigest() != observation["evidence_sha256"]:
            raise ValueError("Visual transcription evidence missing or changed")
        attributes = card_benchmark(observation["source_label"], observation["source_id"])
        if not attributes:
            raise ValueError("Unsupported manually transcribed dimension")
        judge = attributes.pop("judge")
        if attributes["benchmark_id"] == "mmbench" and attributes["split"].startswith("dev"):
            attributes["benchmark"] = "MMBench_DEV_EN_V11"
        row = {"model_id": observation["model_id"], "canonical_model_id": observation["model_id"], "is_canonical": True, **attributes,
               "setting_id": observation["source_id"] + ":default_api_evaluation_other_settings_unknown",
               "score": observation["score"], "source_url": observation["source_url"], "source_type": "official_figure_visual_transcription",
               "source_pointer": observation["source_pointer"],
               "comparability_group": ":".join(["figure", observation["source_id"], attributes["benchmark_id"], attributes["benchmark_version"], attributes["split"], attributes["metric"]]),
               "comparability_status": "source_table_only", "source_label": observation["source_label"],
               "notes": "Assistant visually transcribed official figure; not independent human validation. Figure note: default evaluation through API calls. Hyperparameters, metric details and unprinted benchmark versions unknown. " + observation.get("notes", "")}
        row["result_id"] = result_key(row)
        results.append(row)
        manual_count += 1
    # Only release chronology is generated. A sequence edge never asserts training ancestry.
    relationships = []
    grouped = defaultdict(lambda: defaultdict(list))
    for model in models:
        if model["release_status"] == "verified_day":
            grouped[model["family_id"]][model["release_date"]].append(model)
    for family, dates in sorted(grouped.items()):
        representatives = [sorted(items, key=lambda m: (m["parameters_total_b"] or float("inf"), m["id"]))[0] for date, items in sorted(dates.items())]
        for previous, current in zip(representatives, representatives[1:]):
            relationships.append({"source_model_id": previous["id"], "target_model_id": current["id"], "relationship_type": "release_sequence",
                                  "source_url": current["release_evidence_url"], "source_release_evidence_url": previous["release_evidence_url"],
                                  "target_release_evidence_url": current["release_evidence_url"],
                                  "evidence": previous["release_date"] + " precedes " + current["release_date"] + "; one representative per dated family release; chronology only, not ancestry.",
                                  "inferred": True, "inference_method": "sort_verified_release_dates"})
    # Explicit architecture relationship, distinguished from inherited model weights.
    architecture_source = RAW / "huggingfacetb-smolvlm2-2-2b-instruct.README.md"
    if architecture_source.exists() and "Architecture:** Based on [Idefics3]" in architecture_source.read_text():
        relationships.append({"source_model_id": "huggingfacem4-idefics3-8b-llama3", "target_model_id": "huggingfacetb-smolvlm2-2-2b-instruct", "relationship_type": "architecture_based_on",
                              "source_url": "https://huggingface.co/HuggingFaceTB/SmolVLM2-2.2B-Instruct", "source_release_evidence_url": "", "target_release_evidence_url": "",
                              "evidence": "Model Summary explicitly states Architecture: Based on Idefics3. This is architecture reuse, not a claim that Idefics3 weights were fine-tuned.", "inferred": False, "inference_method": "explicit_official_model_card"})
    # Coverage by source and shared-table groups, with no imputation or best-score selection.
    primary = [row for row in results if row["is_canonical"] and row["is_primary_metric"] and row["visualization_eligible"]]
    coverage = defaultdict(set)
    for row in primary:
        coverage[row["model_id"]].add(row["benchmark_id"])
    default_pair = ["qwen-qwen2-5-vl-7b-instruct", "qwen-qwen2-vl-7b-instruct"]
    default_groups = {}
    for mid in METRIC_BY_ID:
        candidates = [row for row in primary if row["benchmark_id"] == mid and row["model_id"] in default_pair and
                      row["source_url"] == "https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct"]
        groups = defaultdict(dict)
        for row in candidates:
            groups[row["comparability_group"]].setdefault(row["model_id"], []).append(row)
        matched = [(group, records) for group, records in groups.items() if all(len(records.get(key, [])) == 1 for key in default_pair)]
        if len(matched) == 1:
            group, records = matched[0]
            default_groups[mid] = {"comparability_group": group, "scores": {key: records[key][0]["score"] for key in default_pair},
                                   "result_ids": {key: records[key][0]["result_id"] for key in default_pair},
                                   "comparability_status": "source_table_only", "source_url": candidates[0]["source_url"]}
    radar_report = {"default_pair": default_pair, "default_pair_dimension_count": len(default_groups), "dimensions": default_groups,
                    "fully_verified_evaluation_settings": False,
                    "limitation": "Eight published dimensions are available for the default pair when reported below. The original card does not fully specify evaluation settings; same-table comparison is qualified evidence, not a reproduced controlled evaluation. HallBench avg formula is unspecified.",
                    "models": [{"model_id": m["id"], "available_dimensions": sorted(coverage[m["id"]]), "missing_dimensions": sorted(set(METRIC_BY_ID) - coverage[m["id"]])} for m in models]}
    payload = {"schema_version": "1.0", "baseline_snapshot_date": config["baseline_snapshot_date"], "models": models, "baseline_models": baseline_models,
               "metrics": METRICS, "default_radar_pair": default_pair, "default_radar_comparability_groups": {k: v["comparability_group"] for k, v in default_groups.items()},
               "provenance": {"baseline_path": "data/OpenVLM.json", "baseline_sha256": baseline_hash, "config_path": "config/canonical_models.json"}}
    csv_write(FINAL / "benchmark_results.csv", BENCH_FIELDS, results)
    # Git stores the compressed archive; local consumers may use the plain CSV.
    # Empty filename and mtime=0 make repeated offline rebuilds byte-identical.
    with (FINAL / "benchmark_results.csv").open("rb") as source, (FINAL / "benchmark_results.csv.gz").open("wb") as target:
        with gzip.GzipFile(fileobj=target, mode="wb", filename="", mtime=0, compresslevel=9) as compressor:
            shutil.copyfileobj(source, compressor)
    csv_write(FINAL / "model_relationships.csv", ["source_model_id", "target_model_id", "relationship_type", "source_url", "source_release_evidence_url", "target_release_evidence_url", "evidence", "inferred", "inference_method"], relationships)
    write_json(FINAL / "models.json", payload)
    write_json(REPORTS / "model_radar_coverage.json", radar_report)
    registry = {m["id"] for m in models} | {m["id"] for m in baseline_models}
    unique_ids = {r["result_id"] for r in results}
    checks = {"all_result_ids_unique": len(unique_ids) == len(results), "all_result_models_registered": all(r["model_id"] in registry for r in results),
              "all_relationship_endpoints_registered": all(r["source_model_id"] in registry and r["target_model_id"] in registry for r in relationships),
              "all_canonical_ids_unique": len({m["id"] for m in models}) == len(models),
              "all_canonical_repositories_verified": all(m["open_weight"] for m in models),
              "default_pair_has_all_eight_dimensions": len(default_groups) == 8,
              "all_normalized_values_in_range": all(r["normalization_max"] is None or 0 <= r["score"] <= r["normalization_max"] for r in results)}
    report = {"canonical_models": len(models), "canonical_families": dict(Counter(m["family_id"] for m in models)),
              "baseline_models_preserved": len(baseline_models), "baseline_numeric_measurements_preserved": baseline_count,
              "official_card_measurements": official_count, "official_figure_measurements": manual_count,
              "total_benchmark_rows": len(results), "relationship_rows": len(relationships),
              "verified_day_release_dates": sum(m["release_status"] == "verified_day" for m in models),
              "verified_month_only_release_dates": sum(m["release_status"] == "verified_month" for m in models),
              "verified_after_snapshot_models": [m["id"] for m in models if m["after_baseline_snapshot"]],
              "missing_raw_model_cards": missing_sources, "baseline_date_anomalies": date_anomalies,
              "out_of_range_card_cells": rejected_cells, "checks": checks,
              "limitations": ["Baseline META.Time is not treated as a release date.", "Unselected baseline models and closed-weight models are retained only in the baseline registry and raw measurements.",
                              "Rows are reported measurements, not independent new model evaluations; repeated reports across cards are not independent experiments.",
                              "Unknown versions, splits, metric definitions, prompt/settings, release dates and ancestry remain unknown.",
                              "Some official model cards require gated access or publish scores only as images; unverified figures were not transcribed.",
                              "No benchmark was rerun. Eight-dimensional coverage does not establish fully controlled comparability."]}
    write_json(REPORTS / "model_data_quality.json", report)
    if not all(checks.values()):
        raise AssertionError(json.dumps(checks, indent=2))
    print(json.dumps({k: v for k, v in report.items() if k not in ["limitations", "verified_after_snapshot_models", "baseline_date_anomalies", "canonical_families"]}, indent=2))


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def fetch_one(job):
    key, url, suffix = job
    path = RAW / (key + suffix)
    manifest_path = RAW / (key + suffix + ".manifest.json")
    if path.exists() and manifest_path.exists():
        return {"key": key, "url": url, "status": "cached"}
    error = None
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "MLLM-course-project/1.0 (metadata-only research)"})
            with urllib.request.urlopen(request, timeout=50) as response:
                body = response.read()
                final_url = response.geturl()
                headers = {name: response.headers.get(name) for name in ["ETag", "Last-Modified", "Content-Type", "X-Repo-Commit"]}
            path.write_bytes(body)
            manifest = {"source_url": url, "resolved_url": final_url,
                        "retrieved_at": dt.datetime.now(dt.timezone.utc).isoformat(),
                        "sha256": hashlib.sha256(body).hexdigest(), "bytes": len(body),
                        "response_headers": headers}
            write_json(manifest_path, manifest)
            return {"key": key, "url": url, "status": "ok", "bytes": len(body)}
        except (urllib.error.URLError, TimeoutError) as exc:
            error = str(exc)
            if isinstance(exc, urllib.error.HTTPError) and exc.code in (401, 403, 404):
                break
            time.sleep(1 + 2 * attempt)
    return {"key": key, "url": url, "status": "error", "error": error}


def fetch(config):
    RAW.mkdir(parents=True, exist_ok=True)
    jobs = []
    for model in config["models"]:
        jobs.extend([(model["id"], "https://huggingface.co/api/models/" + model["repo_id"], ".api.json"),
                     (model["id"], "https://huggingface.co/" + model["repo_id"] + "/raw/main/README.md", ".README.md")])
    for source in config.get("sources", []):
        jobs.append((source["id"], source["url"], source.get("suffix", ".source.txt")))
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        for result in executor.map(fetch_one, jobs):
            results.append(result)
            print(result["key"], result["status"], result.get("error", ""), flush=True)
    write_json(REPORTS / "model_fetch_report.json", results)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fetch", action="store_true", help="Fetch missing official source caches; existing caches are immutable.")
    parser.add_argument("--fetch-only", action="store_true")
    args = parser.parse_args()
    config = json.loads(CONFIG.read_text())
    for path in [RAW, FINAL, REPORTS]:
        path.mkdir(parents=True, exist_ok=True)
    if args.fetch or args.fetch_only:
        fetch(config)
    if not args.fetch_only:
        build(config)


if __name__ == "__main__":
    main()
