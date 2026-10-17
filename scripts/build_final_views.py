#!/usr/bin/env python3
"""Build a small, provenance-preserving browser payload from the final data tables.
No network, no score inference and no expansion of family feedback into model evidence.
"""
import argparse
import collections
import csv
import datetime as dt
import hashlib
import gzip
import json
import math
import re
from pathlib import Path

METRICS = [
    ('mmmu', 'MMMU', 100), ('mathvista', 'MathVista', 100),
    ('mmbench', 'MMBench', 100), ('mmvet', 'MM-Vet', 100),
    ('hallusion', 'HallusionBench', 100), ('ocrbench', 'OCRBench', 1000),
    ('chartqa', 'ChartQA', 100), ('docvqa', 'DocVQA', 100),
]
ALIASES = {'hallusionbench': 'hallusion', 'mmvet': 'mmvet', 'ocr': 'ocrbench'}

def metric_id(value):
    value = ''.join(c for c in str(value or '').lower() if c.isalnum())
    return ALIASES.get(value, value)

def number(value):
    try:
        n = float(value)
        return n if math.isfinite(n) else None
    except (ValueError, TypeError):
        return None

def month(value):
    value = str(value or '')
    try:
        return dt.date.fromisoformat(value[:10]).strftime('%Y-%m')
    except ValueError:
        return 'unknown'

def records(path):
    compressed = path.with_suffix(path.suffix + '.gz')
    if not path.exists() and not compressed.exists():
        return
    opener = path.open(encoding='utf-8') if path.exists() else gzip.open(compressed, 'rt', encoding='utf-8')
    with opener as handle:
        if path.suffix == '.csv':
            yield from csv.DictReader(handle)
        else:
            for line in handle:
                if line.strip():
                    yield json.loads(line)

def as_list(value):
    if isinstance(value, list):
        return value
    if value in (None, ''):
        return []
    return [value]

def redact_excerpt(value):
    value = str(value or '')
    value = re.sub(r'(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b', '[email removed]', value)
    value = re.sub(r'\b(?:hf_|ghp_|github_pat_|sk-)[A-Za-z0-9_\-]{12,}\b', '[token removed]', value)
    value = re.sub(r'(?i)\b(?:bearer|api[_ -]?key|access[_ -]?token)\s*[:= ]\s*[A-Za-z0-9_.\-]{12,}', '[credential removed]', value)
    value = re.sub(r'(?<![\w.])(?:\+\d{1,3}[ -]?)?(?:\(\d{2,4}\)|\d{3,4})[ -]\d{3,4}[ -]\d{3,4}(?![\w.])', '[phone removed]', value)
    value = re.sub(r'(?<!\d)(?:\+?86[ -]?)?1[3-9]\d{9}(?!\d)', '[phone removed]', value)
    return value[:280]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', type=Path, default=Path(__file__).resolve().parents[1] / 'data/final')
    args = parser.parse_args()
    root = args.data_dir
    root.mkdir(parents=True, exist_ok=True)
    warnings = []
    snapshot_times = []
    def note_snapshot(value):
        if not value:
            return
        try:
            parsed = dt.datetime.fromisoformat(str(value).replace('Z', '+00:00'))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=dt.timezone.utc)
            snapshot_times.append(parsed.astimezone(dt.timezone.utc).isoformat())
        except ValueError:
            pass
    required = ['repositories.jsonl', 'models.json', 'benchmark_results.csv', 'model_relationships.csv', 'feedback.jsonl', 'tasks.json']
    missing = [name for name in required if not (root / name).exists() and not (root / (name + '.gz')).exists()]
    def read_json(name, default):
        path = root / name
        if path.exists():
            return json.loads(path.read_text(encoding='utf-8'))
        compressed = path.with_suffix(path.suffix + '.gz')
        if compressed.exists():
            with gzip.open(compressed, 'rt', encoding='utf-8') as handle:
                return json.load(handle)
        return default
    model_file = read_json('models.json', {})
    models = model_file if isinstance(model_file, list) else model_file.get('models', [])
    models_by_id = {str(m['id']): m for m in models}
    alias = {}
    for model in models:
        note_snapshot(model.get('retrieved_at'))
        for item in [model['id'], model.get('name'), *as_list(model.get('repo_ids'))]:
            if item:
                alias[str(item).lower()] = model['id']
    def resolve_model(value):
        return alias.get(str(value).lower())
    task_file = read_json('tasks.json', {})
    tasks = task_file if isinstance(task_file, list) else task_file.get('tasks', [])
    metrics = []
    supplied_metrics = model_file.get('metrics', []) if isinstance(model_file, dict) else []
    for mid, label, maximum in METRICS:
        supplied = next((m for m in supplied_metrics if metric_id(m.get('id', m.get('benchmark'))) == mid), {})
        metrics.append({'id': mid, 'label': label, 'unit': 'points' if mid == 'ocrbench' else '%', 'range_min': 0, 'range_max': maximum, 'higher_is_better': True, **supplied, 'id': mid, 'label': label})
    for task in tasks:
        task['benchmark_ids'] = [metric_id(v) for v in task.get('benchmark_ids', [])]
    counts = collections.Counter()
    repo_buckets = collections.Counter()
    repo_seen = set()
    for row in records(root / 'repositories.jsonl'):
        note_snapshot(row.get('retrieved_at'))
        rid = row.get('repo_id', row.get('id'))
        if not rid or rid in repo_seen:
            counts['duplicate_repositories_skipped'] += 1
            continue
        repo_seen.add(rid)
        counts['repositories'] += 1
        m = month(row.get('created_at', row.get('createdAt')))
        if m == 'unknown':
            counts['repositories_missing_creation_date'] += 1
        repo_buckets[(m, row.get('family_id') or 'unknown', row.get('repo_type') or 'unknown')] += 1
    release_buckets = collections.Counter()
    for model in models:
        status = str(model.get('release_status', '')).lower()
        verified = ('verified' in status and not any(s in status for s in ['unverified', 'not_verified', 'unconfirmed'])) or model.get('release_verified') is True
        if verified and month(model.get('release_date')) != 'unknown' and model.get('release_evidence_url'):
            release_buckets[(month(model['release_date']), model.get('family_id') or 'unknown', 'canonical_release')] += 1
        else:
            counts['models_without_verified_release'] += 1
    # The browser receives one unique score per model/dimension/comparability group.
    # Conflicting records remain conflicts; they are never resolved by taking a max.
    score_groups = collections.defaultdict(list)
    for row in records(root / 'benchmark_results.csv'):
        counts['benchmark_rows'] += 1
        canonical = row.get('canonical_model_id') or (row.get('model_id') if 'canonical_model_id' not in row else None)
        model_id = resolve_model(canonical) if canonical else None
        mid = metric_id(row.get('benchmark_id', row.get('benchmark')))
        score = number(row.get('score'))
        if not model_id or mid not in {m['id'] for m in metrics} or score is None:
            continue
        if 'visualization_eligible' in row and str(row['visualization_eligible']).lower() not in ['true', '1', 'yes']:
            continue
        if 'is_primary_metric' in row and str(row['is_primary_metric']).lower() not in ['true', '1', 'yes']:
            continue
        group = row.get('comparability_group') or 'unknown_setting'
        score_groups[(model_id, mid, group)].append(row)
    scores = []
    for (model_id, mid, group), rows in score_groups.items():
        signatures = {(number(r['score']), r.get('unit'), r.get('metric'), r.get('split'), r.get('setting_id')) for r in rows}
        row = rows[0]
        ambiguous = len(signatures) > 1
        scores.append({'model_id': model_id, 'benchmark_id': mid, 'comparability_group': group,
            'score': None if ambiguous else number(row['score']), 'ambiguous': ambiguous,
            'source_count': len(rows), 'comparability_status': row.get('comparability_status'), 'benchmark_version': row.get('benchmark_version'),
            'split': row.get('split'), 'metric': row.get('metric'), 'unit': row.get('unit'),
            'setting_id': row.get('setting_id'), 'source_type': row.get('source_type'),
            'normalization_max': number(row.get('normalization_max')),
            'source_urls': sorted({r.get('source_url', '') for r in rows} - {''})[:5]})
    relationships = []
    for row in records(root / 'model_relationships.csv'):
        source = resolve_model(row.get('source_model_id'))
        target = resolve_model(row.get('target_model_id'))
        if source and target and row.get('source_url') and row.get('relationship_type'):
            relationships.append({**row, 'source_model_id': source, 'target_model_id': target})
        else:
            counts['relationships_not_resolved'] += 1
    totals = collections.Counter()
    feedback_roles = collections.Counter()
    feedback_buckets = collections.defaultdict(lambda: {'count': 0, 'actual_experience_count': 0, 'validated_count': 0, 'sentiments': collections.Counter(), 'excerpt_ids': []})
    seen = set()
    excerpt_lookup = {}
    excerpt_quotas = collections.Counter()
    known_tasks = {str(t['id']) for t in tasks}
    for row in records(root / 'feedback.jsonl'):
        note_snapshot(row.get('collected_at'))
        fid = row.get('id')
        if not fid or fid in seen:
            counts['duplicate_feedback_skipped'] += 1
            continue
        seen.add(fid)
        counts['feedback'] += 1
        feedback_roles[row.get('role') or 'unknown'] += 1
        platform = row.get('platform') or 'unknown'
        period = month(row.get('published_at'))
        family = row.get('family_id') or 'unknown'
        totals[(platform, period, family)] += 1
        task_ids = set(str(t) for t in as_list(row.get('task_ids')) if str(t) in known_tasks)
        if task_ids:
            counts['task_labeled_feedback'] += 1
        model_ids = {resolve_model(v) for v in as_list(row.get('model_ids'))} - {None}
        attribution = str(row.get('attribution_level', 'unresolved')).lower()
        if attribution in ['family', 'family_only', 'unresolved', 'unknown']:
            model_ids = set()
        if model_ids:
            counts['exact_model_feedback'] += 1
        scopes = [('all', '')] + [('model', m) for m in sorted(model_ids)]
        if attribution in ['family', 'family_only']:
            scopes += [('family', family)]
        for tid in task_ids:
            for scope, entity in scopes:
                key = (tid, platform, period, family, scope, entity)
                bucket = feedback_buckets[key]
                bucket['count'] += 1
                bucket['actual_experience_count'] += str(row.get('experience_type', '')).lower() in ['actual_experience', 'actual', 'reported_experience', 'experience', 'usage_observation', 'problem_report']
                bucket['validated_count'] += str(row.get('validation_status', '')).lower() in ['validated', 'human_validated', 'reviewed', 'adjudicated']
                bucket['sentiments'][row.get('sentiment') or 'unclear'] += 1
                quota_key = (tid, scope, entity, platform)
                if len(bucket['excerpt_ids']) < 1 and row.get('source_url') and excerpt_quotas[quota_key] < 8 and (fid in excerpt_lookup or len(excerpt_lookup) < 500):
                    bucket['excerpt_ids'].append(fid)
                    excerpt_quotas[quota_key] += 1
                    excerpt_lookup[fid] = {k: row.get(k) for k in ['id', 'platform', 'source_url', 'published_at', 'attribution_level', 'attribution_confidence', 'experience_type', 'validation_status', 'sentiment', 'label_method', 'role']} | {'text': redact_excerpt(row.get('text')), 'truncated': len(str(row.get('text', ''))) > 280}
    families = sorted({m.get('family_id') or 'unknown' for m in models} | {k[1] for k in repo_buckets})
    family_names = {m.get('family_id'): m.get('family') or m.get('family_id') for m in models}
    periods = sorted({k[0] for k in repo_buckets if k[0] != 'unknown'} | {k[1] for k in totals if k[1] != 'unknown'} | {k[0] for k in release_buckets})
    coverage = {metric['id']: len({r['model_id'] for r in scores if r['benchmark_id'] == metric['id'] and not r['ambiguous'] and r['score'] is not None}) for metric in metrics}
    if tasks and len(tasks) < 10:
        warnings.append(f'Only {len(tasks)} supported task categories are prepared; the suggested 10–20 category target has not been reached. Unsupported categories have not been invented.')
    if missing:
        warnings.append('Missing input files: ' + ', '.join(missing))
    if not counts['repositories']:
        warnings.append('No ecosystem repository records are available.')
    if not counts['feedback']:
        warnings.append('No cleaned feedback records are available.')
    if any(n == 0 for n in coverage.values()):
        warnings.append('No unambiguous canonical score for: ' + ', '.join(m['label'] for m in metrics if coverage[m['id']] == 0))
    if counts['feedback'] and not any(b['validated_count'] for b in feedback_buckets.values()):
        warnings.append('Feedback labels have not been manually validated; counts are provisional rule-based labels.')
    payload = {'schema_version': '1.0', 'generated_at': max(snapshot_times) if snapshot_times else None, 'timestamp_definition': 'latest source retrieved_at / collected_at; no wall-clock build timestamp',
        'missing_inputs': missing, 'warnings': warnings, 'counts': dict(counts), 'feedback_roles': dict(feedback_roles), 'models': models,
        'metrics': metrics, 'tasks': tasks, 'families': [{'id': f, 'label': family_names.get(f) or f} for f in families],
        'periods': periods, 'coverage': coverage, 'scores': scores, 'relationships': relationships, 'excerpt_lookup': excerpt_lookup,
        'growth': {'repository_creation': [{'month': m, 'family_id': f, 'repo_type': r, 'count': n} for (m, f, r), n in sorted(repo_buckets.items())],
            'verified_release': [{'month': m, 'family_id': f, 'repo_type': r, 'count': n} for (m, f, r), n in sorted(release_buckets.items())]},
        'feedback_totals': [{'platform': p, 'month': m, 'family_id': f, 'count': n} for (p, m, f), n in sorted(totals.items())],
        'feedback_buckets': [{'task_id': t, 'platform': p, 'month': m, 'family_id': f, 'scope': s, 'entity_id': e, **b} for (t, p, m, f, s, e), b in sorted(feedback_buckets.items())],
        'notes': ['Each distinct comment counts once per task; multi-label task counts are not additive.', 'Family-only feedback is never assigned to individual models.', 'Repository creation and verified model release counts are separate.', 'Fixed benchmark ranges are used; missing values are never zero-filled.', 'Source excerpts are a capped convenience sample (at most 500 distinct records, 280 characters each), with contact/credential patterns redacted. Counts use the entire cleaned dataset; excerpts are not a representative sample.', 'Monthly windows include the full selected months; the acquisition month can be partial.'],
        'input_hashes': {}}
    for name in required:
        path = root / name
        compressed = root / (name + '.gz')
        if not path.exists() and not compressed.exists():
            continue
        digest = hashlib.sha256()
        handle = path.open('rb') if path.exists() else gzip.open(compressed, 'rb')
        with handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b''):
                digest.update(chunk)
        payload['input_hashes'][name] = digest.hexdigest()
    radar_report = root.parent.parent / 'reports/model_radar_coverage.json'
    if radar_report.exists():
        recommendation = json.loads(radar_report.read_text())
        payload['radar_defaults'] = {'pair': recommendation.get('default_pair', []), 'groups': {mid: entry.get('comparability_group', '') for mid, entry in recommendation.get('dimensions', {}).items()}, 'limitation': recommendation.get('limitation', '')}
    output = root / 'view_data.json'
    output.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(output), 'bytes': output.stat().st_size, 'counts': dict(counts), 'coverage': coverage, 'warnings': warnings}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
