"""Create a review queue of recently updated Hugging Face vision-language models.

This is deliberately a discovery step: API results are never merged into the
curated OpenVLM data automatically. Dates, parameter counts, licenses, and
benchmark comparability still need manual verification against model cards and
papers before inclusion.
"""

from __future__ import annotations

import argparse
import csv
import json
import urllib.parse
import urllib.request
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "hf_model_discovery.csv"


def fetch_models(limit: int) -> list[dict]:
    query = urllib.parse.urlencode(
        {
            "pipeline_tag": "image-text-to-text",
            "sort": "lastModified",
            "direction": "-1",
            "limit": str(limit),
            "full": "true",
        }
    )
    request = urllib.request.Request(
        f"https://huggingface.co/api/models?{query}",
        headers={"User-Agent": "stats401-openvlm-research/0.1"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    rows = []
    for model in fetch_models(args.limit):
        tags = model.get("tags") or []
        rows.append(
            {
                "model_id": model.get("modelId", ""),
                "last_modified": model.get("lastModified", ""),
                "downloads": model.get("downloads", 0),
                "likes": model.get("likes", 0),
                "license_tag": next((tag.split(":", 1)[1] for tag in tags if tag.startswith("license:")), ""),
                "gated": model.get("gated", False),
                "model_url": f"https://huggingface.co/{model.get('modelId', '')}",
                "review_status": "needs manual verification",
            }
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=rows[0].keys() if rows else ["model_id"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} discovery candidates to {args.output}")


if __name__ == "__main__":
    main()
