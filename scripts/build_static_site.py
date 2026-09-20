#!/usr/bin/env python3
"""Create a deterministic static deployment bundle in dist/."""

from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
FILES = ["index.html", "app.js", "styles.css", "proposal.md", "README.md", "CHANGELOG.md"]
DIRECTORIES = ["data", "images"]

def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for relative in FILES:
        shutil.copy2(ROOT / relative, DIST / relative)
    for relative in DIRECTORIES:
        shutil.copytree(ROOT / relative, DIST / relative)
    print(f"Built static site at {DIST}")

if __name__ == "__main__":
    main()
