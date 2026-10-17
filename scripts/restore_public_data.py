"""Verify and restore public research archives without overwriting local originals."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import tarfile

ROOT = Path(__file__).resolve().parents[1]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def restore(destination):
    destination = destination.resolve()
    manifest = json.loads((ROOT / 'reports/public_data_manifest.json').read_text())
    for name, metadata in manifest['artifacts'].items():
        if sha((ROOT / name).read_bytes()) != metadata['sha256']:
            raise ValueError('Archive checksum mismatch: ' + name)
    expected = {e['path']: e for e in manifest['raw_files']}
    archive = ROOT / 'data/archives' / f"raw-cache-{manifest['snapshot_date']}.tar.gz"
    pending = []
    with tarfile.open(archive, 'r:gz') as tar:
        seen = set()
        for member in tar:
            target = (destination / member.name).resolve()
            if not member.isfile() or not target.is_relative_to(destination) or member.name not in expected or member.name in seen:
                raise ValueError('Unsafe, duplicate or unregistered archive entry')
            seen.add(member.name)
            payload = tar.extractfile(member).read()
            if sha(payload) != expected[member.name]['published_sha256']:
                raise ValueError('Raw file checksum mismatch: ' + member.name)
            if target.exists() and sha(target.read_bytes()) != sha(payload):
                raise ValueError('Refusing to overwrite a different local file: ' + member.name)
            pending.append((target, payload))
        if seen != set(expected):
            raise ValueError('Missing raw archive entries')
    feedback = gzip.decompress((ROOT / 'data/final/feedback.jsonl.gz').read_bytes())
    if sha(feedback) != manifest['published_feedback_sha256']:
        raise ValueError('Feedback checksum mismatch')
    count = sum(bool(line.strip()) for line in feedback.split(b'\n'))
    if count != manifest['feedback_records']:
        raise ValueError('Feedback record count mismatch')
    target = destination / 'data/final/feedback.jsonl'
    if target.exists() and sha(target.read_bytes()) != sha(feedback):
        raise ValueError('Refusing to overwrite different local feedback; use --destination with an empty directory.')
    pending.append((target, feedback))
    for path, payload in pending:
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_bytes(payload)
    print(json.dumps({'restored_raw_files': len(expected), 'feedback_records': count,
                      'checksums_verified': True}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--destination', type=Path, default=ROOT)
    args = parser.parse_args()
    restore(args.destination)
