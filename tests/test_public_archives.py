import gzip
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('public_package', Path(__file__).resolve().parents[1] / 'scripts/package_public_data.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PublicArchiveTests(unittest.TestCase):
    def test_jsonl_unicode_separator_and_credential_mask(self):
        fake = 'sk-' + 'a' * 40
        rows = [{'text': 'before\u2028after ' + fake}, {'text': 'second record'}]
        source = ('\n'.join(json.dumps(r, ensure_ascii=False) for r in rows) + '\n').encode()
        result, counts = module.sanitize(source, Path('feedback.jsonl'))
        parsed = [json.loads(line) for line in result.decode().split('\n') if line]
        self.assertEqual(len(parsed), 2)
        self.assertIn('\u2028', parsed[0]['text'])
        self.assertNotIn(fake, result.decode())
        self.assertEqual(counts, {'openai_key': 1})

    def test_bearer_mask_keeps_json_valid(self):
        source = json.dumps({'Authorization': 'Bearer ' + 'x' * 40}).encode()
        result, counts = module.sanitize(source, Path('page.json'))
        self.assertEqual(json.loads(result)['Authorization'], 'Bearer [REDACTED_CREDENTIAL]')
        self.assertEqual(counts, {'bearer': 1})

    def test_unmodified_gzip_preserves_original_bytes(self):
        source = gzip.compress(b'{"status":"ok"}', mtime=123)
        result, counts = module.sanitize(source, Path('page.json.gz'))
        self.assertEqual(result, source)
        self.assertEqual(counts, {})


if __name__ == '__main__':
    unittest.main()
