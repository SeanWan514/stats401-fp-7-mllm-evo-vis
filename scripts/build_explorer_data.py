#!/usr/bin/env python3
"""Add traceable user-concern aggregates; never infer model performance from mentions.

Read only the published cleaned corpus. Preserve the original handoff payload so
handoff.html remains reproducible. Every concern count is a distinct source ID.
"""
import collections
import gzip
import hashlib
import json
import re
from pathlib import Path

from build_final_views import redact_excerpt
from process_feedback import analyze_text

ROOT = Path(__file__).resolve().parents[1]
CONCERNS = [
    ('ocr', 'Read text', 'capability', 'ocr', 'ocrbench', 'OCRBench measures mixed text-reading tasks, not every OCR application.'),
    ('documents', 'Understand documents', 'capability', 'document-understanding', 'docvqa', 'DocVQA is a document question-answering proxy, not a complete document-processing test.'),
    ('charts', 'Read charts', 'capability', 'chart-understanding', 'chartqa', 'ChartQA provides chart QA evidence; it does not establish general table-extraction quality.'),
    ('reasoning', 'Visual reasoning', 'capability', 'visual-reasoning', 'mathvista', 'MathVista measures visually grounded mathematical reasoning, a narrower proxy for the requested capability.'),
    ('visual-qa', 'Answer image questions', 'capability', 'visual-qa', 'mmbench', 'MMBench evaluates multiple-choice visual understanding; open-ended deployment may differ.'),
    ('grounding', 'Avoid hallucinations', 'capability', None, 'hallusion', 'HallusionBench is a grounding-related proxy. The source-table average formula is unspecified.'),
    ('latency', 'Respond quickly', 'practical', None, None, 'No hardware- and workload-matched latency measurements were collected. Mention counts are not speed scores.'),
    ('memory', 'Fit available memory', 'practical', None, None, 'No controlled peak-memory measurements were collected. Parameters do not determine GPU memory alone.'),
    ('setup', 'Deploy & fine-tune', 'practical', None, None, 'Setup discussions reveal concerns, not a measured ease-of-use score.'),
    ('reliability', 'Run reliably', 'practical', None, None, 'Issue frequency is affected by users, adoption and reporting; it is not a failure rate.'),
    ('instruction-following', 'Follow instructions', 'practical', None, None, 'Prompt and format mentions do not establish instruction-following accuracy.'),
    ('licensing', 'Use commercially', 'practical', None, None, 'Check the model license. Discussion mentions are not legal permission.'),
    ('captioning', 'Describe images', 'capability', 'image-captioning', None, 'No direct caption-quality measurement is included.'),
    ('conversation', 'Hold visual dialogue', 'capability', 'multimodal-conversation', None, 'No controlled multi-turn dialogue measurement is included.'),
    ('video', 'Understand video', 'adjacent', 'video-understanding', None, 'Only mixed image/video discussion is retained. No video benchmark is included.'),
]

def readable(text):
    text = re.sub(r'(?m)^\s*>.*$', '', str(text))
    text = re.sub(r'```.*?```|`[^`]+`|<[^>]+>|https?://\S+', ' ', text, flags=re.S)
    lines = [l for l in text.splitlines() if not re.search(r'^\s*(?:File |Traceback |import |from \w|def |class |\w+\s*=|[\{\}\[\]]|Loading checkpoint)', l)]
    return redact_excerpt(re.sub(r'\s+', ' ', ' '.join(lines)).strip())

def build():
    original = ROOT / 'data/final/view_data.json'
    data = json.loads(original.read_text())
    counts = collections.Counter()
    buckets = collections.defaultdict(lambda: {'count': 0, 'experience_count': 0, 'excerpt_ids': []})
    excerpts = {}
    source = ROOT / 'data/final/feedback.jsonl.gz'
    ids, corpus = set(), []
    definitions = [dict(zip(['id','label','kind','task_id','benchmark_id','rationale'], c)) for c in CONCERNS]
    with gzip.open(source, 'rt') as handle:
        for line in handle:
            r = json.loads(line)
            if r['id'] in ids:
                raise ValueError('Duplicate feedback ID')
            ids.add(r['id'])
            tasks, aspects = set(r.get('task_ids', [])), {a['aspect'] for a in r.get('aspects', [])}
            text = analyze_text(r.get('text', ''))
            found = set()
            for c in definitions:
                if c['task_id'] in tasks or (c['task_id'] is None and c['id'] in aspects):
                    found.add(c['id'])
            if re.search(r'\bhallucinat\w*\b|幻觉|编造|捏造', text, re.I):
                found.add('grounding')
            if found:
                counts['concern_labeled_feedback'] += 1
            scopes = [('all', '')]
            if r.get('attribution_level') == 'model':
                scopes += [('model', m) for m in sorted(set(r.get('model_ids', [])))]
            else:
                scopes += [('family', r.get('family_id', 'unknown'))]
            sample = readable(r.get('text', ''))
            for cid in sorted(found):
                for scope, entity in scopes:
                    key = (cid,r['platform'],str(r['published_at'])[:7],r['family_id'],scope,entity)
                    b = buckets[key]
                    b['count'] += 1
                    b['experience_count'] += r.get('experience_type') in ('usage_observation','problem_report')
                    if len(b['excerpt_ids']) < 2 and len(sample) >= 40 and (r['id'] in excerpts or len(excerpts) < 1000):
                        b['excerpt_ids'].append(r['id'])
                        excerpts[r['id']] = {k:r.get(k) for k in ('id','source_url','platform','published_at','experience_type','attribution_level','family_id','model_ids')}
                        excerpts[r['id']]['text'] = sample
                        excerpts[r['id']]['truncated'] = True
            corpus.append(r)
    data['concerns'] = definitions
    data['concern_buckets'] = [dict(zip(['concern_id','platform','month','family_id','scope','entity_id'], key), **value) for key,value in sorted(buckets.items())]
    data['concern_excerpts'] = excerpts
    data['counts'].update(counts)
    data['radar_concerns'] = [c[0] for c in CONCERNS[:8]]
    data['design_version'] = '2026-10-18-evidence-atlas'
    # New public excerpts omit inherited quoted text, code, URLs and contact patterns.
    for excerpt in data['excerpt_lookup'].values():
        excerpt['text'] = readable(excerpt.get('text', ''))
    output = ROOT / 'data/final/explorer_data.json'
    output.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n')
    report = {
        'feedback_records':len(ids),'repository_records':data['counts']['repositories'],
        'concern_labeled_records':counts['concern_labeled_feedback'],
        'concern_counts':{c['id']:sum(b['count'] for b in data['concern_buckets'] if b['scope']=='all' and b['concern_id']==c['id']) for c in definitions},
        'input_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'definition':'A record counts once per concern; categories overlap. Counts are not population preferences or satisfaction scores.',
        'validation':'Rule-generated exploratory labels; no human accuracy estimate. AI spot inspection is not human validation.',
        'radar':'Six concern-aligned benchmark proxies plus two explicitly unmeasured practical concerns. No missing-to-zero conversion.',
    }
    (ROOT/'reports/explorer_data_audit.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__ == '__main__':
    build()
