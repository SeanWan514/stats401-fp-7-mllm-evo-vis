"""Regression checks for evidence aggregation; run with python3 -m unittest discover -s tests."""
import csv
import gzip
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/build_final_views.py'
spec = importlib.util.spec_from_file_location('build_final_views', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class FinalViewContract(unittest.TestCase):
    def test_privacy_excerpt_and_unicode(self):
        text = 'Contact test@example.com +1 555-123-4567 hf_abcdefghijklmnop; text\u2028continued'
        result = module.redact_excerpt(text)
        self.assertNotIn('test@example.com', result)
        self.assertNotIn('555-123-4567', result)
        self.assertNotIn('hf_abcdefghijklmnop', result)
        self.assertIn('continued', result)
        self.assertLessEqual(len(module.redact_excerpt('x' * 1000)), 280)

    def test_counts_provenance_missingness_and_compressed_input(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            def save(name, value):
                (root/name).write_text(json.dumps(value), encoding='utf-8')
            def jsonl(name, rows):
                (root/name).write_text(''.join(json.dumps(row, ensure_ascii=False)+'\n' for row in rows), encoding='utf-8')
            save('models.json', {'models': [{'id':'m1','name':'Model 1','family_id':'f','repo_ids':['org/model'], 'release_status':'unknown','release_date':None,'retrieved_at':'2026-01-01T00:00:00Z'}]})
            save('tasks.json', {'tasks':[{'id':'ocr','label':'OCR','benchmark_ids':['ocrbench']}]})
            jsonl('repositories.jsonl', [{'id':'org/model','family_id':'f','created_at':'2025-09-01','repo_type':'original_release','retrieved_at':'2026-01-02T00:00:00Z'}]*2)
            base={'platform':'github','published_at':'2025-09-09','collected_at':'2026-01-03T00:00:00Z','text':'Real test\u2028observation','task_ids':['ocr','ocr'],'source_url':'https://example.com/comment','family_id':'f','experience_type':'problem_report','validation_status':'pending_human_review'}
            jsonl('feedback.jsonl', [{**base,'id':'family','attribution_level':'family','model_ids':['m1']},{**base,'id':'exact','attribution_level':'model','model_ids':['m1']},{**base,'id':'unmapped','attribution_level':'model','model_ids':[]},{**base,'id':'unlabeled','attribution_level':'family','model_ids':[],'task_ids':[]},{**base,'id':'exact','attribution_level':'model','model_ids':['m1']}])
            columns=['model_id','canonical_model_id','benchmark_id','score','unit','metric','split','setting_id','comparability_group','visualization_eligible','is_primary_metric','source_url']
            with gzip.open(root/'benchmark_results.csv.gz','wt',encoding='utf-8',newline='') as handle:
                writer=csv.DictWriter(handle,fieldnames=columns);writer.writeheader()
                row=dict(model_id='m1',canonical_model_id='m1',benchmark_id='ocrbench',score=700,unit='points',metric='total',split='test',setting_id='s',comparability_group='g',visualization_eligible='true',is_primary_metric='true',source_url='https://example.com/score')
                writer.writerow(row);writer.writerow({**row,'score':710});writer.writerow({**row,'score':800,'comparability_group':'ignored','visualization_eligible':'false'})
            (root/'model_relationships.csv').write_text('source_model_id,target_model_id,relationship_type,source_url,evidence\n')
            subprocess.run([sys.executable,str(SCRIPT),'--data-dir',str(root)],check=True,capture_output=True)
            first=(root/'view_data.json').read_bytes();view=json.loads(first)
            self.assertEqual(view['missing_inputs'],[])
            self.assertEqual(view['counts']['repositories'],1)
            self.assertEqual(view['counts']['feedback'],4)
            self.assertEqual(view['counts']['task_labeled_feedback'],3)
            self.assertEqual(sum(r['count'] for r in view['feedback_totals']),4)
            self.assertEqual(sum(r['count'] for r in view['feedback_buckets'] if r['scope']=='all'),3)
            self.assertEqual(sum(r['count'] for r in view['feedback_buckets'] if r['scope']=='model'),1)
            self.assertEqual(sum(r['count'] for r in view['feedback_buckets'] if r['scope']=='family'),1)
            self.assertTrue(view['scores'][0]['ambiguous']);self.assertIsNone(view['scores'][0]['score'])
            self.assertEqual(len(view['scores']),1)
            self.assertEqual(view['growth']['verified_release'],[])
            self.assertEqual(view['generated_at'],'2026-01-03T00:00:00+00:00')
            subprocess.run([sys.executable,str(SCRIPT),'--data-dir',str(root)],check=True,capture_output=True)
            self.assertEqual(first,(root/'view_data.json').read_bytes())
            (root/'benchmark_results.csv').write_bytes(gzip.decompress((root/'benchmark_results.csv.gz').read_bytes()))
            subprocess.run([sys.executable,str(SCRIPT),'--data-dir',str(root)],check=True,capture_output=True)
            self.assertEqual(first,(root/'view_data.json').read_bytes())

    def test_missing_inputs_are_reported(self):
        with tempfile.TemporaryDirectory() as temporary:
            subprocess.run([sys.executable,str(SCRIPT),'--data-dir',temporary],check=True,capture_output=True)
            view=json.loads((Path(temporary)/'view_data.json').read_text())
            self.assertEqual(len(view['missing_inputs']),6)
            self.assertEqual(view['models'],[])
            self.assertTrue(view['warnings'])

if __name__ == '__main__':
    unittest.main()
