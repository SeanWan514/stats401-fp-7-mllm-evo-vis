#!/usr/bin/env python3
"""Verify public release bytes, separately from interactive browser testing."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
from build_static_site import source_map

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/'
FILES = ['index.html', 'explorer.js', 'explorer-core.mjs', 'explorer.css',
         'vendor/d3.v7.min.js', 'data/final/explorer_data.json',
         'interim.html', 'handoff.html', 'final.html', 'dialogs.css', 'task-selection.css',
         'pre-modal.html', 'pre-modal.js', 'pre-modal.css', 'pre-modal-core.mjs',
         'slides.js', 'slides.css', 'pre-slides.html', 'pre-slides.js', 'pre-slides.css',
         'pre-slides-core.mjs', 'pre-slides-dialogs.css', 'pre-slides-task-selection.css',
         'assets/js/explorer.js', 'assets/js/explorer-core.mjs', 'assets/js/slides.js',
         'assets/css/explorer.css', 'assets/css/dialogs.css', 'assets/css/task-selection.css', 'assets/css/slides.css',
         'deliverables/Group_7_MLLMs_Final_Report.pdf', 'deliverables/STATS401_Poster_Group_7_Wan_Huang_Ou.pdf',
         'deliverables/checksums.sha256', 'README.md', 'REPORT.md']
SOURCES = source_map()

def check(name):
    result = subprocess.run(['curl', '--max-time', '45', '--retry', '2', '--compressed', '-fsS', BASE + name],
                            capture_output=True, check=True)
    remote = hashlib.sha256(result.stdout).hexdigest()
    local = hashlib.sha256(SOURCES[name].read_bytes()).hexdigest()
    return {'file': name, 'bytes': len(result.stdout), 'sha256': remote,
            'matches_local': remote == local}

if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=4) as pool:
        checks = list(pool.map(check, FILES))
    report = {'checked_at': datetime.now(timezone.utc).isoformat(), 'url': BASE,
              'source_commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'checks': checks, 'all_match': all(r['matches_local'] for r in checks),
              'scope': 'HTTPS retrieval and byte identity; not an interactive production-browser test.'}
    (ROOT / 'reports/production_release_check.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report, indent=2))
    if not report['all_match']:
        raise SystemExit('Deployment bytes do not yet match the tested release.')
