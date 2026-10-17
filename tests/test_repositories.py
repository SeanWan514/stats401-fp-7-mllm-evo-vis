"""Regression checks for repository family/provenance mistakes found in the cache."""
import importlib.util
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('collect_repositories', ROOT / 'scripts/collect_repositories.py')
collector = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(collector)


def normalize(repo_id, *, tags=(), card=None, task='image-text-to-text'):
    return collector.normalize(
        {'id': repo_id, 'tags': list(tags), 'pipeline_tag': task,
         'cardData': {'language': ['en']} if card is None else card},
        {'retrieved_at': '2026-10-17T00:00:00+00:00', 'response_sha256': 'test',
         'query_name': 'image-text-popular'},
        ROOT / 'data/raw/repositories/test-fixture.json.gz',
    )


class RepositoryFamilyTests(unittest.TestCase):
    def test_named_models_are_not_reclassified_by_training_datasets(self):
        fixtures = [
            ('HuggingFaceM4/idefics2-8b', ['dataset:jxu124/llava_conversation_58k'], 'idefics'),
            ('anuragpradhan/SmolVLM2-2.2B-Instruct-bnb-4bit',
             ['idefics3', 'dataset:liuhaotian/LLaVA-Instruct-150K'], 'smolvlm'),
            ('google/paligemma-3b-pt-224', ['gemma'], 'paligemma'),
        ]
        for repo_id, tags, family in fixtures:
            with self.subTest(repo_id=repo_id):
                row, reason = normalize(repo_id, tags=tags)
                self.assertIsNone(reason)
                self.assertEqual(row['family_id'], family)
                self.assertEqual(row['relevance_evidence']['family_inference_source'], 'repository_model_name')

    def test_model_name_precedes_explicit_base_and_architecture(self):
        row, _ = normalize('org/SmolVLM2-custom', tags=['idefics3'],
                           card={'base_model': 'org/Idefics3-8B'})
        self.assertEqual(row['family_id'], 'smolvlm')

    def test_explicit_base_precedes_architecture(self):
        row, _ = normalize('org/custom-model', tags=['llava'],
                           card={'base_model': 'OpenGVLab/InternVL2-8B'})
        self.assertEqual(row['family_id'], 'internvl')
        self.assertEqual(row['relevance_evidence']['family_inference_source'], 'explicit_base_model')

    def test_namespaced_tags_and_publishers_are_not_architectures(self):
        row, _ = normalize('llava-enthusiast/custom-model', tags=[
            'dataset:org/llava-training', 'arxiv:llava', 'license:llava',
        ])
        self.assertEqual(row['family_id'], 'unknown')
        row, _ = normalize('org/custom-model', tags=['idefics3'])
        self.assertEqual(row['family_id'], 'idefics')

    def test_relationship_qualified_base_tags_are_explicit_base_evidence(self):
        row, _ = normalize('org/custom-model', tags=[
            'base_model:finetune:OpenGVLab/InternVL2-8B', 'llava'])
        self.assertEqual(row['family_id'], 'internvl')
        self.assertEqual(row['base_repo_ids'], ['OpenGVLab/InternVL2-8B'])
        self.assertEqual(row['relevance_evidence']['family_inference_source'], 'explicit_base_model')

    def test_conflicting_bases_remain_unknown(self):
        row, _ = normalize('org/model-merge', tags=['llava'], card={
            'base_model': ['OpenGVLab/InternVL2-8B', 'Qwen/Qwen2-VL-7B-Instruct']})
        self.assertEqual(row['family_id'], 'unknown')
        self.assertEqual(row['relevance_evidence']['family_inference_source'], 'conflicting_base_model_families')


class RepositoryQuantizationTests(unittest.TestCase):
    def test_format_alone_does_not_establish_quantization(self):
        for suffix in ['MLX', 'MLX-FP16', 'GGUF', 'BF16-GGUF', 'FP16', 'BF16']:
            with self.subTest(suffix=suffix):
                row, _ = normalize('org/Qwen2-VL-7B-' + suffix)
                self.assertEqual(row['repo_type'], 'unknown')
                self.assertNotIn('quantization', row['derivative_flags'])
                if 'MLX' in suffix or 'GGUF' in suffix:
                    self.assertIn('format_conversion', row['derivative_flags'])

    def test_explicit_methods_and_bit_widths_remain_quantization(self):
        for suffix in ['Q4_K_M-GGUF', 'Q8_0', 'IQ4_NL', 'AWQ', 'GPTQ',
                       'FP8', 'NVFP4', 'int4', 'W4A16', '4bit', '4.5bpw',
                       'BF16-Q4_K_M-GGUF']:
            with self.subTest(suffix=suffix):
                row, _ = normalize('org/Qwen2-VL-7B-' + suffix)
                self.assertEqual(row['repo_type'], 'quantization')
                self.assertIn('quantization', row['derivative_flags'])

    def test_explicit_quantized_relation_is_evidence_unless_contradicted(self):
        for kwargs in [
            {'card': {'base_model_relation': 'quantized'}},
            {'tags': ['base_model:quantized:Qwen/Qwen2-VL-7B-Instruct']},
        ]:
            with self.subTest(kwargs=kwargs):
                row, _ = normalize('org/custom-export', **kwargs)
                self.assertEqual(row['repo_type'], 'quantization')
                self.assertEqual(row['repo_type_confidence'], 'metadata')

    def test_full_precision_conflicting_relation_is_not_counted_as_quantization(self):
        for suffix in ['F16-GGUF', 'BF16-MLX', 'unquantized-GGUF']:
            with self.subTest(suffix=suffix):
                row, _ = normalize('AI4SGI/ExoMind-9B-' + suffix,
                                   card={'base_model_relation': 'quantized'})
                self.assertEqual(row['repo_type'], 'unknown')
                self.assertIn('quantization_metadata_conflict', row['derivative_flags'])
                self.assertIn('format_conversion', row['derivative_flags'])

    def test_finetune_format_conversion_keeps_both_facts(self):
        row, _ = normalize('ahishamm/SmolDocling-256M-preview-mlx-fp16',
                           tags=['idefics3', 'mlx', 'mlxvlm',
                                 'base_model:finetune:ds4sd/SmolDocling-256M-preview'])
        self.assertEqual(row['repo_type'], 'fine_tune')
        self.assertCountEqual(row['derivative_flags'], ['format_conversion', 'fine_tune'])

    def test_base_and_dataset_bit_names_do_not_quantize_current_model(self):
        row, _ = normalize('org/Qwen2-VL-custom', tags=[
            'dataset:org/AWQ-4bit-examples', 'base_model:org/Qwen2-VL-7B-AWQ'])
        self.assertEqual(row['repo_type'], 'unknown')

    def test_official_namespace_does_not_override_format_conversion(self):
        row, _ = normalize('Qwen/Qwen2-VL-7B-GGUF')
        self.assertEqual(row['repo_type'], 'unknown')
        self.assertEqual(row['derivative_flags'], ['format_conversion'])


class RepositoryRelevanceTests(unittest.TestCase):
    def test_random_fixtures_are_excluded(self):
        for repo_id in ['org/tiny-random-LlavaForConditionalGeneration',
                        'org/Qwen2-VL-random-init']:
            with self.subTest(repo_id=repo_id):
                row, reason = normalize(repo_id)
                self.assertIsNone(row)
                self.assertEqual(reason, 'explicit_test_repository')

    def test_known_text_only_variants_are_excluded(self):
        for repo_id, tags in [
            ('gaianet/medgemma-27b-text-it-GGUF', []),
            ('cryptonaut/gemma-3-1b-it-abliterated-Q4_K_M-GGUF', []),
            ('org/gemma-3-270m', []),
            ('org/custom', ['gemma3_text']),
        ]:
            with self.subTest(repo_id=repo_id):
                row, reason = normalize(repo_id, tags=tags)
                self.assertIsNone(row)
                self.assertEqual(reason, 'explicit_text_only_model')

    def test_clip_classifier_is_excluded(self):
        row, reason = normalize('Amirhossein75/clip-vit-base-mmhs150k-fusion', card={
            'model-index': [{'results': [{'task': {'type': 'multi-label-classification',
                                                 'name': 'Hate Speech Detection'}}]}]})
        self.assertIsNone(row)
        self.assertEqual(reason, 'non_generative_clip_classifier')


if __name__ == '__main__':
    unittest.main()
