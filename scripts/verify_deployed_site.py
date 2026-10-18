#!/usr/bin/env python3
"""Verify public release bytes, separately from interactive browser testing."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://seanwan514.github.io/stats401-fp-7-mllm-evo-vis/'
FILES = ['index.html', 'explorer.js', 'explorer-core.mjs', 'explorer.css',
         'vendor/d3.v7.min.js', 'data/final/explorer_data.json',
         'interim.html', 'handoff.html', 'final.html', 'dialogs.css', 'task-selection.css',
         'pre-modal.html', 'pre-modal.js', 'pre-modal.css', 'pre-modal-core.mjs']

def check(name):
    result = subprocess.run(['curl', '--max-time', '60', '--compressed', '-fsS', BASE + name],
                            capture_output=True, check=True)
    remote = hashlib.sha256(result.stdout).hexdigest()
    local = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
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
