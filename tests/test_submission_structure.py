"""Protect grading entry points and the public/archived path contract."""
import hashlib
import importlib.util
from pathlib import Path
import re
import tempfile
import unittest
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('static_build', ROOT / 'scripts/build_static_site.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class SubmissionStructure(unittest.TestCase):
    def test_grader_guide_lists_all_nine_deliverables_first(self):
        readme = (ROOT / 'README.md').read_text()
        self.assertLess(readme.index("Grader's View"), readme.index('The question behind'))
        for number in range(1, 10):
            self.assertIn(f'| {number} |', readme)

    def test_current_document_links_resolve(self):
        for name in ['README.md', 'REPORT.md', 'CONTRIBUTING.md', 'deliverables/README.md',
                     'data/README.md', 'docs/README.md', 'docs/quickstart.md', 'archive/README.md',
                     'docs/repository-cleanup.md', 'archive/report-drafts/REPORT.md']:
            source = ROOT / name
            for target in re.findall(r'\]\(([^)]+)\)', source.read_text()):
                url = urlsplit(target)
                if url.scheme or not url.path:
                    continue
                self.assertTrue((source.parent / unquote(url.path)).exists(), (name, target))

    def test_submitted_pdf_bytes_match_recorded_originals(self):
        rows = (ROOT / 'deliverables/checksums.sha256').read_text().splitlines()
        self.assertEqual(len(rows), 2)
        for row in rows:
            expected, filename = row.split('  ', 1)
            data = (ROOT / 'deliverables' / filename).read_bytes()
            self.assertTrue(data.startswith(b'%PDF-'))
            self.assertEqual(hashlib.sha256(data).hexdigest(), expected)

    def test_build_preserves_all_historical_routes_and_active_assets(self):
        sources = build.source_map()
        for name in build.ARCHIVE_FILES:
            self.assertEqual(sources[name], ROOT / 'archive/website' / name)
            self.assertFalse((ROOT / name).exists(), 'frozen file leaked back into root')
        for name in build.ASSETS:
            self.assertEqual(sources[name], ROOT / name)
            self.assertEqual(sources[Path(name).name], ROOT / name)
        for name in build.DELIVERABLES:
            self.assertIn('deliverables/' + name, sources)
        for forbidden in ['data/raw/', 'data/archives/', 'data/final/feedback.jsonl', '.env', 'tmp/', 'output/']:
            self.assertFalse(any(name.startswith(forbidden) for name in sources), forbidden)

    def test_built_html_dependencies_and_report_files_are_present(self):
        with tempfile.TemporaryDirectory() as temp:
            destination = Path(temp) / 'site'
            build.main(destination)
            for name in ['index.html', 'final.html', 'pre-slides.html', 'pre-modal.html', 'interim.html', 'handoff.html']:
                html = (destination / name).read_text()
                for target in re.findall(r'(?:src|href)=["\']([^"\']+)["\']', html):
                    url = urlsplit(target)
                    if url.scheme or url.netloc or not url.path:
                        continue
                    self.assertTrue((destination / unquote(url.path)).exists(), (name, target))
            for name in build.DELIVERABLES:
                self.assertEqual((destination / 'deliverables' / name).read_bytes(),
                                 (ROOT / 'deliverables' / name).read_bytes())


if __name__ == '__main__':
    unittest.main()
