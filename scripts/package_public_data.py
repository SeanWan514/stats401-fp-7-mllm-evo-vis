"""Package the full research handoff, masking credential-like strings in copies."""
from collections import Counter
import gzip
import hashlib
import io
import json
from pathlib import Path
import re
import tarfile

ROOT = Path(__file__).resolve().parents[1]
STAMP = '2026-10-17'
PATTERNS = {
    'hf_token': re.compile(r'\bhf_[A-Za-z0-9]{25,}\b'),
    'github_token': re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{35,})\b'),
    'openai_key': re.compile(r'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{30,}\b'),
    'private_key': re.compile(r'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----.*?-----END (?:RSA |OPENSSH |EC )?PRIVATE KEY-----', re.S),
    'aws_access_key': re.compile(r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    'bearer': re.compile(r'(?i)(authorization[\s"\x27:=]+bearer[ \t]+)([A-Za-z0-9_./+-]{20,})'),
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def sanitize(data, path):
    decoded = gzip.decompress(data) if path.suffix == '.gz' else data
    try:
        text = decoded.decode('utf-8')
    except UnicodeError:
        return data, {}
    counts = {}
    for name, pattern in PATTERNS.items():
        replacement = (lambda m: m.group(1) + '[REDACTED_CREDENTIAL]') if name == 'bearer' else '[REDACTED_CREDENTIAL]'
        text, count = pattern.subn(replacement, text)
        if count:
            counts[name] = count
    if not counts:
        return data, counts
    if path.suffix == '.json':
        json.loads(text)
    elif path.suffix == '.jsonl':
        for line in text.split('\n'):
            if line.strip():
                json.loads(line)
    published = text.encode('utf-8')
    if path.suffix == '.gz':
        published = gzip.compress(published, mtime=0)
    return published, counts


def main():
    folder = ROOT / 'data/archives'
    folder.mkdir(parents=True, exist_ok=True)
    archive = folder / f'raw-cache-{STAMP}.tar.gz'
    entries, total = [], Counter()
    with archive.open('wb') as output, gzip.GzipFile(fileobj=output, mode='wb', filename='', mtime=0) as compressed:
        with tarfile.open(fileobj=compressed, mode='w|', format=tarfile.PAX_FORMAT) as tar:
            for path in sorted((ROOT / 'data/raw').rglob('*')):
                if not path.is_file():
                    continue
                source = path.read_bytes()
                published, redactions = sanitize(source, path)
                name = str(path.relative_to(ROOT))
                info = tarfile.TarInfo(name)
                info.size = len(published)
                info.mode = 0o644
                info.mtime = 0
                tar.addfile(info, io.BytesIO(published))
                entries.append({'path': name, 'source_sha256': sha(source),
                                'published_sha256': sha(published), 'published_bytes': len(published),
                                'credential_redactions': redactions})
                total.update(redactions)
    feedback = ROOT / 'data/final/feedback.jsonl'
    original = feedback.read_bytes()
    published, redactions = sanitize(original, feedback)
    target = feedback.with_suffix('.jsonl.gz')
    with target.open('wb') as output, gzip.GzipFile(fileobj=output, mode='wb', filename='', mtime=0) as compressed:
        compressed.write(published)
    total.update(redactions)
    count = sum(bool(line.strip()) for line in published.split(b'\n'))
    report = {
        'snapshot_date': STAMP, 'branch': 'shilin',
        'raw_cache_file_count': len(entries),
        'source_raw_bytes': sum((ROOT / e['path']).stat().st_size for e in entries),
        'feedback_records': count,
        'credential_redactions': dict(total),
        'redacted_raw_files': sum(bool(e['credential_redactions']) for e in entries),
        'feedback_credential_redactions': redactions,
        'source_feedback_sha256': sha(original), 'published_feedback_sha256': sha(published),
        'artifacts': {str(p.relative_to(ROOT)): {'bytes': p.stat().st_size, 'sha256': sha(p.read_bytes())}
                      for p in [archive, target]},
        'raw_files': entries,
        'notes': [
            'All local raw files and all retained feedback records are included; credential-like strings are masked in public copies only.',
            'Original local files remain unchanged. Source and published hashes are distinct where redaction occurred.',
            'Embedded source-response hashes refer to the original acquisition; published file hashes are listed here.',
            'Initial feedback caches are normalized selected fields, with separately documented representative later API response archives.',
            'No blanket relicensing of third-party material; original source terms and attributions still apply.',
        ],
    }
    for metadata in report['artifacts'].values():
        assert metadata['bytes'] < 95_000_000, 'Split artifact before pushing a GitHub-sized file.'
    (ROOT / 'reports/public_data_manifest.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: report[k] for k in ['raw_cache_file_count', 'source_raw_bytes', 'feedback_records', 'credential_redactions', 'redacted_raw_files', 'artifacts']}, indent=2))


if __name__ == '__main__':
    main()
