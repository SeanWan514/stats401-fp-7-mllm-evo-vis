#!/usr/bin/env python3
"""Create a deterministic static deployment bundle in dist/."""

from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
FILES = ["index.html", "proposal.md", "README.md", "REPORT.md", "CONTRIBUTING.md", "CHANGELOG.md", ".nojekyll", "final.html"]
ASSETS = ["assets/js/explorer.js", "assets/js/explorer-core.mjs", "assets/js/slides.js",
          "assets/css/explorer.css", "assets/css/dialogs.css", "assets/css/task-selection.css", "assets/css/slides.css"]
ARCHIVE_FILES = ["app.js", "styles.css", "final.js", "final.css", "interim.html", "handoff.html",
         "pre-modal.html", "pre-modal.js", "pre-modal.css", "pre-modal-core.mjs",
         "pre-slides.html", "pre-slides.js", "pre-slides.css",
         "pre-slides-core.mjs", "pre-slides-dialogs.css", "pre-slides-task-selection.css"]
DELIVERABLES = ["Group_7_MLLMs_Final_Report.pdf", "STATS401_Poster_Group_7_Wan_Huang_Ou.pdf", "README.md", "checksums.sha256"]
# An explicit allowlist prevents research caches and full community text from
# being published by the existing deployment workflow.
PUBLIC_DATA = ["OpenVLM.json", "interim_models.json", "final/models.json",
               "final/tasks.json", "final/view_data.json", "final/explorer_data.json"]
PUBLIC_DOCS = ["requirements-audit.md", "final-view-contract.md", "data-pipeline.md",
               "model-methodology.md", "feedback-methodology.md", "implementation-plan.md",
               "README.md", "quickstart.md", "data-dictionary.md", "user-review.md",
               "final-website-audit.md", "redesign-and-rollback.md", "modal-refinement-checklist.md",
               "slide-layout-checklist.md", "repository-cleanup.md"]
PUBLIC_REPORTS = ["delivery.md", "delivery-zh.md", "final_validation.json", "repository_counts.json",
                  "feedback_quality.json", "model_data_quality.json", "model_radar_coverage.json",
                  "model_validation.json", "feedback_raw_provenance.json", "reproducibility.json",
                  "public_data_manifest.json", "public_reconstruction.json", "README.md",
                  "teammate_workflow_validation.json", "explorer_data_audit.json", "production_release_check.json"]

def source_map():
    """Public URL -> source; old root URLs stay available without root clutter."""
    sources = {name: ROOT / name for name in FILES + ASSETS}
    sources.update({name: ROOT / "archive/website" / name for name in ARCHIVE_FILES})
    # Compatibility for previous public module/style URLs.
    sources.update({Path(name).name: ROOT / name for name in ASSETS})
    sources.update({"deliverables/" + name: ROOT / "deliverables" / name for name in DELIVERABLES})
    for folder in ["images", "vendor", "docs/screenshots"]:
        for path in (ROOT / folder).rglob("*"):
            if path.is_file():
                sources[str(path.relative_to(ROOT))] = path
    for folder, filenames in [("data", PUBLIC_DATA), ("docs", PUBLIC_DOCS), ("reports", PUBLIC_REPORTS)]:
        for filename in filenames:
            source = ROOT / folder / filename
            sources[folder + "/" + filename] = source
    return sources

def main(destination=DIST) -> None:
    sources = source_map()
    missing = [str(path) for path in sources.values() if not path.is_file()]
    if missing:
        raise FileNotFoundError("Missing allowlisted source: " + ", ".join(missing))
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    for relative, source in sources.items():
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    print(f"Built {len(sources)} public files at {destination}")

if __name__ == "__main__":
    main()
