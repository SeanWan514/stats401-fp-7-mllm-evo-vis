"""Collect public HF repository metadata, then reproduce a conservative ecosystem table.

Only API metadata is fetched; model weights and remote repository code are never run.
Use --pilot for a first checkpoint, --collect for the bounded full collection,
and --process for an entirely offline rebuild from preserved gzip responses.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path
import re
import time
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/repositories'
OUT = ROOT / 'data/final'
REPORTS = ROOT / 'reports'
FIELDS = ['author', 'createdAt', 'lastModified', 'downloads', 'likes', 'tags',
          'cardData', 'safetensors', 'pipeline_tag', 'gated', 'sha', 'library_name']
QUERIES = [
    ('image-text-popular', 'image-text-to-text', 'downloads', 30),
    ('image-text-recent', 'image-text-to-text', 'createdAt', 12),
    ('image-to-text', 'image-to-text', 'downloads', 6),
    ('visual-qa', 'visual-question-answering', 'downloads', 4),
]
FAMILIES = [
    ('qwen-vl', r'qwen(?:2(?:[._]5)?[-_]?vl|3[-_]?vl|3[._][578]|[-_]?vl)|qwen2_5_vl'),
    ('internvl', r'internvl'), ('minicpm-v', r'minicpm[-_ ]?[vo]'),
    ('llava', r'llava|bakllava'), ('molmo', r'molmo'), ('gemma', r'gemma'),
    ('phi-vision', r'phi[-_ ]?[34].*(?:vision|multimodal)|phi3_v'),
    ('idefics', r'idefics'), ('smolvlm', r'smolvlm'),
    ('deepseek-vl', r'deepseek[-_]?vl'), ('cogvlm', r'cogvlm|cogagent'),
    ('glm-vision', r'glm[-_ ]?[45].*v|glm[-_]?4v'), ('ovis', r'ovis'),
    ('pixtral', r'pixtral'), ('mistral-vision', r'mistral[-_]?small[-_]?3'),
    ('paligemma', r'paligemma'), ('mllama', r'llama[-_ ]?(?:3[._]2.*vision|4)|mllama'),
    ('mplug', r'mplug'), ('florence', r'florence'), ('kosmos', r'kosmos'),
    ('blip', r'\bblip|instructblip'), ('openflamingo', r'openflamingo'),
    ('nvila', r'nvila|vila'), ('hunyuan-vision', r'hunyuan.*vision'),
    ('llama-vision', r'llama.*vision'), ('moondream', r'moondream'),
    ('eagle', r'eagle'), ('kimi-vl', r'kimi[-_]?vl'), ('keye-vl', r'keye'),
]
OFFICIAL = {'qwen', 'opengvlab', 'openbmb', 'llava-hf', 'liuhaotian', 'allenai',
            'google', 'microsoft', 'huggingfacetb', 'huggingfacem4', 'deepseek-ai',
            'thudm', 'zai-org', 'aidealab', 'mistralai', 'meta-llama', 'microsoft',
            'vikhyatk', 'nvidia', 'apple', 'openflamingo', 'buaa', 'tencent'}


def now():
    return datetime.now(timezone.utc).isoformat()


def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')


def first_url(task, sort):
    pairs = [('pipeline_tag', task), ('sort', sort), ('direction', '-1'), ('limit', '500')]
    pairs.extend(('expand[]', field) for field in FIELDS)
    return 'https://huggingface.co/api/models?' + urllib.parse.urlencode(pairs)


def get_page(url):
    # Do not send authorization to a pagination URL on another host.
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != 'https' or parsed.netloc != 'huggingface.co':
        raise ValueError('Unexpected pagination destination')
    # curl uses the host trust store; TLS verification remains enabled.
    # Public metadata needs no authentication, so tokens never enter argv/logs.
    for attempt in range(5):
        with tempfile.TemporaryDirectory(prefix='stats401-hf-') as temp:
            header_path = Path(temp) / 'headers'
            body_path = Path(temp) / 'body'
            result = subprocess.run([
                'curl', '--location', '--silent', '--show-error', '--fail-with-body',
                '--max-time', '60', '--user-agent', 'stats401-mllm-data/1.0',
                '--dump-header', str(header_path), '--output', str(body_path), url,
            ], capture_output=True, text=True, timeout=70)
            header_text = header_path.read_text() if header_path.exists() else ''
            statuses = re.findall(r'HTTP/[^ ]+ (\d+)', header_text)
            status = int(statuses[-1]) if statuses else None
            response_headers = {}
            for line in header_text.splitlines():
                if ': ' in line:
                    k, v = line.split(': ', 1)
                    response_headers[k.lower()] = v
            if result.returncode == 0:
                body = body_path.read_bytes()
                link = response_headers.get('link', '')
                match = re.search(r'<([^>]+)>;\s*rel="next"', link)
                return {
                    'url': url, 'retrieved_at': now(),
                    'next_url': match.group(1) if match else None,
                    'response_sha256': hashlib.sha256(body).hexdigest(),
                    'headers': {k: v for k, v in response_headers.items()
                                if k in {'link', 'ratelimit', 'ratelimit-policy', 'etag'}},
                    'data': json.loads(body),
                }
            if status not in (None, 429, 500, 502, 503, 504) or attempt == 4:
                raise RuntimeError(f'HTTP {status}: {result.stderr[:300]}')
            retry = response_headers.get('retry-after', '')
            delay = min(float(retry), 300) if retry.isdigit() else 2 ** (attempt + 1)
            print('Rate/server response; waiting', delay, 'seconds', flush=True)
            time.sleep(delay)


def collect(pilot=False):
    RAW.mkdir(parents=True, exist_ok=True)
    errors = []
    for label, task, sort, max_pages in QUERIES:
        url = first_url(task, sort)
        pages = 1 if pilot else max_pages
        for page in range(pages):
            path = RAW / f'{label}-{page:04d}.json.gz'
            try:
                if path.exists():
                    with gzip.open(path, 'rt') as f:
                        envelope = json.load(f)
                else:
                    envelope = get_page(url)
                    envelope['query_name'] = label
                    with gzip.open(path, 'wt', encoding='utf-8') as f:
                        json.dump(envelope, f, ensure_ascii=False)
                    time.sleep(.35)
                print(label, page + 1, len(envelope['data']), 'records', flush=True)
                url = envelope['next_url']
                if not url:
                    break
            except Exception as exc:
                errors.append({'query': label, 'page': page, 'error': str(exc)})
                print('Query stopped:', label, str(exc), flush=True)
                break
    dump(REPORTS / 'repository_acquisition_errors.json', errors)


def family_in_text(value):
    """Prefer the first named family, rather than a global family-rule ordering."""
    matches = []
    for order, (family, pattern) in enumerate(FAMILIES):
        match = re.search(pattern, value.lower())
        if match:
            matches.append((match.start(), order, family))
    return min(matches)[2] if matches else 'unknown'


def family_evidence(repo_id, tags, bases):
    # Publisher names and training-dataset tags are not model identities.
    # Example: Idefics2 and SmolVLM use LLaVA datasets without becoming LLaVA.
    family = family_in_text(repo_id.rsplit('/', 1)[-1])
    if family != 'unknown':
        return family, 'repository_model_name'
    base_families = {family_in_text(base.rsplit('/', 1)[-1]) for base in bases}
    base_families.discard('unknown')
    if len(base_families) == 1:
        return next(iter(base_families)), 'explicit_base_model'
    if len(base_families) > 1:
        return 'unknown', 'conflicting_base_model_families'
    # Architecture tags are bare identifiers. Namespace tags such as dataset:,
    # base_model:, arxiv: and license: must never supply a family match here.
    architecture_families = {family_in_text(tag) for tag in tags
                             if re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', tag)}
    architecture_families.discard('unknown')
    if len(architecture_families) == 1:
        return next(iter(architecture_families)), 'architecture_tag'
    return 'unknown', 'conflicting_architecture_tags' if architecture_families else 'unresolved'


def family_for(repo_id, tags, bases):
    return family_evidence(repo_id, tags, bases)[0]


def quantization_evidence(repo_id, tags, relation):
    """Separate containers/runtime conversions from actual lower-bit evidence."""
    own_name = repo_id.rsplit('/', 1)[-1].lower()
    bare_tags = [tag.lower() for tag in tags if ':' not in tag and '/' not in tag]
    own_text = ' '.join([own_name, *bare_tags])
    format_conversion = bool(re.search(r'gguf|(?:^|[^a-z])mlx(?:[^a-z]|$)|mlxvlm', own_text))
    quantized_relation = relation == 'quantized' or any(tag.startswith('base_model:quantized:') for tag in tags)
    bit_signal = re.search(
        r'(?<![a-z0-9])(?:gptq|awq|exl[23]|bitsandbytes)(?![a-z0-9])'
        r'|(?<![a-z0-9])(?:nv|mx)?fp[48](?![a-z0-9])'
        r'|(?<![a-z0-9])int[2-8](?![a-z0-9])'
        r'|(?<![a-z0-9])i?q[2-8](?:_[a-z0-9]+)+'
        r'|(?<![a-z0-9])w[2-8]a(?:8|16)(?![a-z0-9])'
        r'|(?<![0-9])[2-8](?:[._][0-9]+)?[-_ ]?(?:bits?|bpw)(?![a-z])', own_text)
    full_precision = bool(re.search(r'(?<![a-z0-9])(?:bf16|fp16|fp32|f16|f32)(?![a-z0-9])', own_text))
    explicitly_unquantized = bool(re.search(r'(?<![a-z])unquantized(?![a-z])', own_text))
    # Some uploaders label F16 GGUF exports as base_model:quantized. Keep that
    # conflicting source metadata, but do not count it as proven quantization.
    conflict = explicitly_unquantized or (full_precision and quantized_relation and not bit_signal)
    if conflict:
        return False, format_conversion, 'conflicting_quantization_metadata'
    if bit_signal:
        return True, format_conversion, 'explicit_quantization_method_or_bit_width'
    if quantized_relation:
        return True, format_conversion, 'explicit_quantized_relation'
    return False, format_conversion, 'format_only' if format_conversion else 'unresolved'


def normalize(model, envelope, raw_path):
    rid = model.get('id') or model.get('modelId')
    if not rid or '/' not in rid:
        return None, 'missing_repository_id'
    tags = model.get('tags') or []
    card = model.get('cardData') or {}
    if not isinstance(card, dict):
        card = {}
    task = model.get('pipeline_tag') or card.get('pipeline_tag')
    if task not in {'image-text-to-text', 'image-to-text', 'visual-question-answering'}:
        return None, 'unsupported_task'
    if re.search(r'(^|[/_-])(dummy|empty|test-repo|test-model|test123)([/_-]|$)|tiny[-_]?random|random[-_](?:init|weights)', rid.lower()):
        return None, 'explicit_test_repository'
    if any(t in tags for t in ('text-to-image', 'image-to-image', 'unconditional-image-generation')):
        return None, 'conflicting_image_generation_task'
    bases = card.get('base_model') or []
    if isinstance(bases, str):
        bases = [bases]
    bases = [b for b in bases if isinstance(b, str)] if isinstance(bases, list) else []
    for t in tags:
        if t.startswith('base_model:'):
            # Both base_model:owner/name and relationship-qualified variants
            # are explicit provenance; neither is an architecture tag.
            parts = t.split(':', 2)
            base = parts[-1]
            if '/' in base:
                bases.append(base)
    bases = sorted(set(bases))
    family, family_source = family_evidence(rid, tags, bases)
    evidence_text = ' '.join([rid, *tags, *bases]).lower()
    if ('gemma3_text' in evidence_text or 'text-only' in evidence_text
            or re.search(r'gemma[-_]?3[-_](?:1b|270m)(?:[-_/]|$)|medgemma[-_]27b[-_]text', evidence_text)):
        return None, 'explicit_text_only_model'
    model_index = json.dumps(card.get('model-index', []), ensure_ascii=False).lower()
    if family == 'unknown' and 'clip' in evidence_text and any(t in model_index for t in ('multi-label-classification', 'image-classification', 'hate speech detection')):
        return None, 'non_generative_clip_classifier'
    # Legacy captioning/VQA tags include stand-alone vision classifiers. Require
    # a known language-generating VLM family for these broader discovery queries.
    if task != 'image-text-to-text' and family == 'unknown':
        return None, 'legacy_task_without_vlm_evidence'
    if task == 'image-text-to-text' and family == 'unknown' and not card:
        return None, 'tag_only_without_card_or_family_evidence'
    text = ' '.join([rid, *tags]).lower()
    relation = card.get('base_model_relation')
    publisher = model.get('author') or rid.split('/')[0]
    kind, confidence, type_evidence = 'unknown', 'unresolved', 'Insufficient explicit provenance'
    derived_flags = []
    is_quantized, format_conversion, quantization_source = quantization_evidence(rid, tags, relation)
    if format_conversion:
        derived_flags.append('format_conversion')
        type_evidence = 'GGUF/MLX format or runtime conversion; container alone does not establish quantization'
    if quantization_source == 'conflicting_quantization_metadata':
        derived_flags.append('quantization_metadata_conflict')
        type_evidence = 'Full-precision/unquantized name conflicts with a quantized relation; quantization unresolved'
    if is_quantized:
        kind, confidence = 'quantization', 'metadata' if quantization_source == 'explicit_quantized_relation' else 'heuristic'
        type_evidence = ('Explicit base_model quantized relation' if confidence == 'metadata'
                         else 'Explicit quantization method or lower-bit signal in model name/tags')
        derived_flags.append('quantization')
    if 'peft' in tags or 'lora' in text or relation == 'adapter':
        derived_flags.append('adapter')
        if kind == 'unknown':
            kind, confidence, type_evidence = 'adapter', 'metadata', 'PEFT/LoRA metadata'
    if relation in ('finetune', 'fine-tune') or any(t.startswith('base_model:finetune:') for t in tags):
        derived_flags.append('fine_tune')
        if kind == 'unknown':
            kind, confidence, type_evidence = 'fine_tune', 'metadata', 'Explicit base_model_relation'
    if kind == 'unknown' and not derived_flags and publisher.lower() in OFFICIAL:
        kind, confidence = 'original_release', 'publisher_context'
        type_evidence = 'Repository under a documented model publisher; does not imply a new base architecture'
    license_value = card.get('license') or next((t.split(':', 1)[1] for t in tags if t.startswith('license:')), None)
    safetensors = model.get('safetensors') or {}
    stored_params = safetensors.get('total') if isinstance(safetensors, dict) else None
    rec = {
        'id': 'hf:' + str(model.get('_id') or rid), 'repo_id': rid,
        'publisher': publisher, 'family_id': family, 'pipeline_tag': task,
        'modalities': ['image', 'text'], 'tags': tags,
        'created_at': model.get('createdAt'), 'last_modified': model.get('lastModified'),
        'release_date': None, 'release_status': 'not_verified_at_repository_level',
        'license': license_value, 'gated': model.get('gated'),
        'parameters_stored': stored_params, 'parameters_scope': 'safetensors_stored_tensors' if stored_params else None,
        'parameters_total_b': None, 'parameters_active_b': None,
        'downloads': model.get('downloads'), 'downloads_window': 'last_month_hf_api',
        'likes': model.get('likes'), 'retrieved_at': envelope['retrieved_at'],
        'repo_type': kind, 'repo_type_confidence': confidence,
        'repo_type_evidence': type_evidence, 'derivative_flags': derived_flags,
        'base_repo_ids': bases, 'base_model_relation': relation,
        'relevance_status': 'metadata_supported_not_individually_audited',
        'relevance_evidence': {'pipeline_tag': task, 'family_pattern': family,
                               'family_inference_source': family_source, 'has_model_card_metadata': bool(card)},
        'source_url': 'https://huggingface.co/' + rid,
        'api_url': 'https://huggingface.co/api/models/' + rid,
        'source_raw_file': str(raw_path.relative_to(ROOT)),
        'source_response_sha256': envelope['response_sha256'],
        'discovery_queries': [envelope['query_name']],
    }
    return rec, None


def process():
    OUT.mkdir(parents=True, exist_ok=True)
    REPORTS.mkdir(parents=True, exist_ok=True)
    unique, rejects, raw_n, manifest = {}, Counter(), 0, []
    for path in sorted(RAW.glob('*.json.gz')):
        with gzip.open(path, 'rt') as f:
            envelope = json.load(f)
        manifest.append({k: envelope[k] for k in ('url', 'retrieved_at', 'response_sha256', 'query_name')})
        for m in envelope['data']:
            raw_n += 1
            key = str(m.get('_id') or m.get('id'))
            if key in unique:
                unique[key]['queries'].add(envelope['query_name'])
                continue
            unique[key] = {'model': m, 'envelope': envelope, 'path': path, 'queries': {envelope['query_name']}}
    rows, rejected_rows = [], []
    for entry in unique.values():
        rec, reason = normalize(entry['model'], entry['envelope'], entry['path'])
        if reason:
            rejects[reason] += 1
            rejected_rows.append({'repo_id': entry['model'].get('id'), 'reason': reason})
        else:
            rec['discovery_queries'] = sorted(entry['queries'])
            rows.append(rec)
    rows.sort(key=lambda r: r['repo_id'].lower())
    with (OUT / 'repositories.jsonl').open('w', encoding='utf-8') as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, separators=(',', ':')) + '\n')
    report = {
        'schema_version': '1.0', 'raw_observations': raw_n, 'unique_repositories_before_filter': len(unique),
        'duplicates_across_queries': raw_n - len(unique), 'excluded': sum(rejects.values()),
        'exclusion_reasons': dict(rejects), 'accepted_repositories': len(rows),
        'target': 10000, 'target_met': len(rows) >= 10000,
        'shortfall': max(0, 10000-len(rows)),
        'by_family': dict(Counter(r['family_id'] for r in rows)),
        'by_repository_type': dict(Counter(r['repo_type'] for r in rows)),
        'by_derivative_flag': dict(Counter(flag for r in rows for flag in r['derivative_flags'])),
        'by_task': dict(Counter(r['pipeline_tag'] for r in rows)),
        'missing': {field: sum(r[field] is None for r in rows)
                    for field in ['created_at', 'last_modified', 'license', 'parameters_stored', 'downloads', 'likes']},
        'retrieval_start': min((r['retrieved_at'] for r in rows), default=None),
        'retrieval_end': max((r['retrieved_at'] for r in rows), default=None),
        'sampling': 'Bounded multi-query sample: popularity plus recent repository creation; not an exhaustive Hub census.',
        'limitations': [
            'Metadata-supported relevance; repository classification and family inference are not human validated.',
            'Repository creation history is a surviving-snapshot history, not a count of original model releases.',
            'Original release means publisher distribution rather than a proven new model architecture.',
            'Family inference prioritizes model name, explicit base model and then bare architecture tags; dataset tags are excluded.',
            'GGUF/MLX alone indicates format conversion; quantization requires a lower-bit/method signal or an uncontradicted explicit relation.',
            'Stored tensor counts can describe adapters or quantized tensors; not total or active model parameters.',
            'Downloads and likes are engagement counters, not unique users or satisfaction ratings.',
        ],
    }
    dump(REPORTS / 'repository_counts.json', report)
    dump(REPORTS / 'repository_source_manifest.json', manifest)
    dump(REPORTS / 'repository_exclusions.json', rejected_rows)
    # Reproducible inspection sample across inferred types, including unknowns.
    sample = []
    for kind in sorted({r['repo_type'] for r in rows}):
        group = [r for r in rows if r['repo_type'] == kind]
        group.sort(key=lambda r: hashlib.sha256(r['id'].encode()).hexdigest())
        sample.extend(group[:20])
    dump(REPORTS / 'repository_review_sample.json', sample)
    print(json.dumps({k: report[k] for k in ('raw_observations', 'accepted_repositories', 'target_met', 'shortfall')}, indent=2), flush=True)
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pilot', action='store_true')
    parser.add_argument('--collect', action='store_true')
    parser.add_argument('--process', action='store_true')
    args = parser.parse_args()
    if args.pilot or args.collect:
        collect(pilot=args.pilot)
    report = process()
    if args.pilot:
        dump(REPORTS / 'repository_pilot.json', report)
