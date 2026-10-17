"""Rebuild all final tables from local caches and compare output bytes."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = [
    'repositories.jsonl', 'models.json', 'benchmark_results.csv',
    'benchmark_results.csv.gz', 'model_relationships.csv', 'feedback.jsonl',
    'tasks.json', 'view_data.json',
]


def hashes():
    return {name: hashlib.sha256((ROOT / 'data/final' / name).read_bytes()).hexdigest()
            for name in OUTPUTS}


def main():
    before = hashes()
    commands = [
        ['scripts/collect_repositories.py', '--process'],
        ['scripts/build_final_models.py'],
        ['scripts/process_feedback.py'],
        ['scripts/build_final_views.py'],
        ['scripts/validate_final_data.py'],
    ]
    for args in commands:
        print('Offline rebuild:', ' '.join(args), flush=True)
        result = subprocess.run([sys.executable, *args], cwd=ROOT, capture_output=True, text=True)
        if result.returncode:
            print(result.stdout[-2000:] + result.stderr[-2000:], file=sys.stderr)
            return result.returncode
    after = hashes()
    matches = {name: before[name] == after[name] for name in OUTPUTS}
    raw_files = sorted(p for p in (ROOT / 'data/raw').rglob('*') if p.is_file())
    raw_hashes = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in raw_files}
    report = {
        'offline_rebuild_byte_identical': all(matches.values()),
        'outputs_match': matches, 'artifact_sha256': after,
        'commands': ['python3 ' + ' '.join(args) for args in commands],
        'local_raw_file_count': len(raw_files),
        'local_raw_manifest_sha256': hashlib.sha256(json.dumps(raw_hashes, sort_keys=True).encode()).hexdigest(),
        'scope': 'Rebuild from local frozen caches; raw feedback caches are normalized extracts with separately documented response-archive limits. No network acquisition or human label validation.',
    }
    (ROOT / 'reports/reproducibility.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'passed': all(matches.values()), 'outputs_match': matches}, indent=2))
    return 0 if all(matches.values()) else 1


if __name__ == '__main__':
    sys.exit(main())
