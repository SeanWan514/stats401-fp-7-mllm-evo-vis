"""Create an exploratory sentiment table from a consented/public comment export.

Input is JSON Lines with model, source, url, created_at, and text fields. The
small transparent lexicon is only a prototype; final analysis should validate
it against a manually labelled sample and report source/platform bias.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


POSITIVE = {
    "accurate", "better", "clear", "fast", "good", "great", "helpful",
    "impressive", "improved", "reliable", "strong", "useful", "works",
}
NEGATIVE = {
    "bad", "biased", "broken", "confusing", "fails", "hallucinate",
    "hallucination", "inaccurate", "slow", "unstable", "worse", "wrong",
}
TOKEN = re.compile(r"[A-Za-z][A-Za-z'-]+")


def sentiment(text: str) -> tuple[int, str]:
    words = [token.lower() for token in TOKEN.findall(text)]
    score = sum(word in POSITIVE for word in words) - sum(word in NEGATIVE for word in words)
    label = "positive" if score > 0 else "negative" if score < 0 else "neutral"
    return score, label


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    rows = []
    for line_number, line in enumerate(args.input.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        row = json.loads(line)
        missing = {field for field in ("model", "source", "url", "created_at", "text") if field not in row}
        if missing:
            raise ValueError(f"Line {line_number} is missing fields: {sorted(missing)}")
        score, label = sentiment(str(row["text"]))
        rows.append({**row, "sentiment_score": score, "sentiment_label": label})

    args.output.write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} scored comments to {args.output}")


if __name__ == "__main__":
    main()
