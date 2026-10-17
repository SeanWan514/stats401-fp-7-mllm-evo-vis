#!/usr/bin/env python3
"""Create a deterministic static deployment bundle in dist/."""

from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
FILES = ["index.html", "app.js", "styles.css", "proposal.md", "README.md", "CONTRIBUTING.md", "CHANGELOG.md", ".nojekyll",
         "final.html", "final.js", "final.css"]
# An explicit allowlist prevents research caches and full community text from
# being published by the existing deployment workflow.
PUBLIC_DATA = ["OpenVLM.json", "interim_models.json", "final/models.json",
               "final/tasks.json", "final/view_data.json"]
PUBLIC_DOCS = ["requirements-audit.md", "final-view-contract.md", "data-pipeline.md",
               "model-methodology.md", "feedback-methodology.md", "implementation-plan.md",
               "README.md", "quickstart.md", "data-dictionary.md", "visualization-guide.html"]
PUBLIC_REPORTS = ["delivery.md", "delivery-zh.md", "final_validation.json", "repository_counts.json",
                  "feedback_quality.json", "model_data_quality.json", "model_radar_coverage.json",
                  "model_validation.json", "feedback_raw_provenance.json", "reproducibility.json",
                  "public_data_manifest.json", "public_reconstruction.json", "README.md",
                  "teammate_workflow_validation.json", "visualization-qa.md"]

def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for relative in FILES:
        shutil.copy2(ROOT / relative, DIST / relative)
    shutil.copytree(ROOT / "images", DIST / "images")
    if (ROOT / "docs/screenshots").exists():
        shutil.copytree(ROOT / "docs/screenshots", DIST / "docs/screenshots")
    for folder, filenames in [("data", PUBLIC_DATA), ("docs", PUBLIC_DOCS), ("reports", PUBLIC_REPORTS)]:
        for filename in filenames:
            source = ROOT / folder / filename
            if source.exists():
                target = DIST / folder / filename
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
    print(f"Built static site at {DIST}")

if __name__ == "__main__":
    main()
