"""Validate real exported tables and reconcile counts without claiming human accuracy."""
import csv
import gzip
import hashlib
import json
import math
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/final'


def jsonl(path):
    with path.open() as f:
        for line in f:
            if line.strip():
                yield json.loads(line)


def csvrows(path):
    if path.exists():
        f = path.open(newline='')
    else:
        f = gzip.open(str(path) + '.gz', 'rt', newline='')
    with f:
        yield from csv.DictReader(f)


def main():
    errors, checks, stats = [], {}, {}

    def check(name, ok, detail=None):
        checks[name] = bool(ok)
        if not ok:
            errors.append({'check': name, 'detail': detail})

    required = ['repositories.jsonl', 'models.json', 'model_relationships.csv', 'feedback.jsonl', 'tasks.json', 'view_data.json']
    absent = [name for name in required if not (DATA / name).exists()]
    check('required_files', not absent, absent)
    if absent:
        print(json.dumps(errors))
        return 1
    model_file = json.loads((DATA / 'models.json').read_text())
    models = model_file['models']
    canonical_ids = {m['id'] for m in models}
    all_model_ids = canonical_ids | {m['id'] for m in model_file.get('baseline_models', [])}
    task_file = json.loads((DATA / 'tasks.json').read_text())
    task_ids = {t['id'] for t in task_file['tasks']}
    check('canonical_unique_ids', len(canonical_ids) == len(models))
    check('task_unique_ids', len(task_ids) == len(task_file['tasks']))
    check('verified_release_has_source', all(m.get('release_evidence_url') for m in models if m.get('release_date')))
    stats['canonical_models'] = len(models)
    stats['canonical_families'] = len({m['family_id'] for m in models})
    stats['task_definitions'] = len(task_ids)
    repo_ids, repo_names = set(), set()
    missing_repo_sources = 0
    for r in jsonl(DATA / 'repositories.jsonl'):
        if r['id'] in repo_ids:
            errors.append({'check': 'repository_unique_id', 'detail': r['id']})
        if r['repo_id'].lower() in repo_names:
            errors.append({'check': 'repository_unique_name', 'detail': r['repo_id']})
        repo_ids.add(r['id'])
        repo_names.add(r['repo_id'].lower())
        missing_repo_sources += not all(r.get(k) for k in ('source_url', 'retrieved_at', 'source_response_sha256'))
    stats['repositories'] = len(repo_ids)
    check('repository_provenance', missing_repo_sources == 0, missing_repo_sources)
    check('repository_target', len(repo_ids) >= 10000, len(repo_ids))
    feedback_ids, sources, dangling_models, dangling_tasks = set(), 0, set(), set()
    task_labeled, model_attributed, human_validated = 0, 0, 0
    for r in jsonl(DATA / 'feedback.jsonl'):
        if r['id'] in feedback_ids:
            errors.append({'check': 'feedback_unique_id', 'detail': r['id']})
        feedback_ids.add(r['id'])
        sources += not all(r.get(k) for k in ('source_url', 'text', 'published_at', 'collected_at', 'thread_id'))
        dangling_models.update(set(r.get('model_ids', [])) - canonical_ids)
        dangling_tasks.update(set(r.get('task_ids', [])) - task_ids)
        task_labeled += bool(r.get('task_ids'))
        model_attributed += bool(r.get('model_ids'))
        human_validated += r.get('validation_status') in ('human_validated', 'validated')
    stats.update(feedback=len(feedback_ids), task_labeled_feedback=task_labeled,
                 exact_canonical_feedback=model_attributed, human_validated_feedback=human_validated)
    check('feedback_target', len(feedback_ids) >= 10000, len(feedback_ids))
    check('feedback_provenance', sources == 0, sources)
    check('feedback_model_foreign_keys', not dangling_models, sorted(dangling_models))
    check('feedback_task_foreign_keys', not dangling_tasks, sorted(dangling_tasks))
    result_ids, bad_scores, bad_model_ids, bad_sources = set(), 0, set(), 0
    for row in csvrows(DATA / 'benchmark_results.csv'):
        rid = row['result_id']
        if rid in result_ids:
            errors.append({'check': 'benchmark_unique_id', 'detail': rid})
        result_ids.add(rid)
        if row['model_id'] not in all_model_ids:
            bad_model_ids.add(row['model_id'])
        try:
            bad_scores += not math.isfinite(float(row['score']))
        except (ValueError, TypeError):
            bad_scores += 1
        bad_sources += not row['source_url'] or not row['source_pointer']
    stats['benchmark_rows'] = len(result_ids)
    check('benchmark_finite_scores', bad_scores == 0, bad_scores)
    check('benchmark_foreign_keys', not bad_model_ids, sorted(bad_model_ids))
    check('benchmark_provenance', bad_sources == 0, bad_sources)
    relations = list(csvrows(DATA / 'model_relationships.csv'))
    check('relationship_foreign_keys', all(r['source_model_id'] in canonical_ids and r['target_model_id'] in canonical_ids for r in relations))
    check('relationship_provenance', all(r['source_url'] and r['evidence'] and r['relationship_type'] for r in relations))
    stats['relationship_rows'] = len(relations)
    view = json.loads((DATA / 'view_data.json').read_text())
    for key in ('repositories', 'feedback', 'benchmark_rows'):
        check('view_count_' + key, view['counts'].get(key) == stats[key], [view['counts'].get(key), stats[key]])
    check('view_no_missing_inputs', not view['missing_inputs'], view['missing_inputs'])
    hashes = {}
    for name in required:
        hashes[name] = hashlib.sha256((DATA / name).read_bytes()).hexdigest()
    result = {
        'structural_checks_passed': not errors, 'checks': checks, 'counts': stats,
        'errors': errors, 'artifact_sha256': hashes,
        'research_validation': {'human_label_validation_complete': False,
                                'human_reviewed_records': human_validated,
                                'completion_evidence': 'Pending independent annotator review, overlap agreement and held-out accuracy report.',
                                'note': 'Structural integrity and volume are not proof of label accuracy or causal/model suitability claims.'},
    }
    (ROOT / 'reports').mkdir(exist_ok=True)
    (ROOT / 'reports/final_validation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'passed': not errors, 'counts': stats, 'errors': errors}, indent=2))
    return 0 if not errors else 1


if __name__ == '__main__':
    sys.exit(main())
