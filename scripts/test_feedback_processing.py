"""Regression tests for counting and rule behavior, not human label accuracy."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import process_feedback as feedback


class FeedbackProcessingTest(unittest.TestCase):
    def test_negation_mixed_and_unknown(self):
        cases = {
            "It is accurate but slow": "mixed",
            "It is not good": "negative",
            "It is not working": "negative",
            "It is not bad": "positive",
            "结果不准确": "negative",
            "推理不慢": "positive",
            "识别准确但是速度很慢": "mixed",
            "How can I load the model?": "unknown",
        }
        for text, expected in cases.items():
            with self.subTest(text=text):
                self.assertEqual(feedback.polarity(text)["label"], expected)

    @staticmethod
    def row(identifier, **updates):
        row = {
            "platform": "github", "source_object_id": identifier, "thread_id": "12",
            "source_url": f"https://github.com/example/model/issues/12#issuecomment-{identifier}",
            "published_at": "2026-10-01T00:00:00Z", "collected_at": "2026-10-17T00:00:00Z",
            "text": "I tested OCR and image captioning. The model is accurate but slow.",
            "role": "community", "object_type": "issue_comment", "author_hash": "author",
            "source_repo": "example/model", "family_id": "qwen-vl", "model_ids": ["example/model"],
            "scope": "family", "source_evidence_url": "https://github.com/example/model",
            "thread_resolved": True, "is_pull_request": False,
        }
        row.update(updates)
        return row

    def test_task_terms_do_not_match_documentation_or_matplotlib(self):
        row = self.row("a", text="Please update the documentation and matplotlib installation instructions.")
        labels = feedback.classify(row, {})
        self.assertNotIn("document-understanding", labels["task_ids"])
        self.assertNotIn("chart-understanding", labels["task_ids"])

    def test_aspect_polarity_is_clause_specific(self):
        for text in ("The model is accurate but slow.", "识别准确但是推理很慢。"):
            row = feedback.classify(self.row("aspect", text=text), {})
            aspects = {x["aspect"]: x["polarity"] for x in row["aspects"]}
            self.assertEqual(aspects["accuracy"], "positive")
            self.assertEqual(aspects["latency"], "negative")
            self.assertEqual(row["sentiment"], "mixed")

    def test_inference_and_chat_template_are_setup_not_user_tasks(self):
        for text in ("vllm推理出现cuda错误，max_position参数需要调整。", "The chat template requires a different configuration."):
            row = feedback.classify(self.row("setup", text=text), {})
            self.assertNotIn("visual-reasoning", row["task_ids"])
            self.assertNotIn("multimodal-conversation", row["task_ids"])
            self.assertIn("setup", {a["aspect"] for a in row["aspects"]})

    def test_quoted_email_is_not_new_feedback(self):
        text = "感谢～\n发自我的iPhone\n---原始邮件---\nThis model is wrong and the setup crashes repeatedly."
        self.assertEqual(feedback.authored_text(text), "感谢～")
        self.assertEqual(feedback.polarity(feedback.analyze_text(text))["label"], "unknown")

    def test_chinese_reasoning_is_resolved_by_context(self):
        capability = feedback.classify(self.row("cap", text="这个模型的数学推理能力很强，答案也比较准确。"), {})
        runtime = feedback.classify(self.row("runtime", text="推理速度很慢，部署后GPU显存占用一直很高。"), {})
        ambiguous = feedback.classify(self.row("amb", text="我想详细了解这个模型的推理，能否提供进一步说明。"), {})
        self.assertIn("visual-reasoning", capability["task_ids"])
        self.assertEqual(capability["reasoning_term_resolution"], "capability")
        self.assertNotIn("visual-reasoning", runtime["task_ids"])
        self.assertEqual(runtime["reasoning_term_resolution"], "runtime")
        self.assertNotIn("visual-reasoning", ambiguous["task_ids"])
        self.assertEqual(ambiguous["task_candidates"], ["visual-reasoning"])

    def test_explicit_other_variant_overrides_repository_context(self):
        row = self.row("variant", platform="huggingface", scope="model", source_repo="Qwen/Qwen2-VL-7B-Instruct",
                       model_ids=["Qwen/Qwen2-VL-7B-Instruct"], text='I am using Qwen/Qwen2-VL-2B and it fails when I load an image.')
        labeled = feedback.classify(row, {"Qwen/Qwen2-VL-7B-Instruct": "qwen-7b"})
        self.assertEqual(labeled["attribution_level"], "family")
        self.assertEqual(labeled["model_ids"], [])
        self.assertEqual(labeled["attribution_evidence"]["type"], "conflicting_model_mentions")

    def test_independent_count_pr_bot_and_model_attribution(self):
        rows = [self.row("a", text="I tested OCR and captioning.\u2028The model is accurate but slow."), self.row("a"), self.row("pr", is_pull_request=True),
                self.row("bot", role="bot"),
                self.row("hf", platform="huggingface", scope="model", role="unknown")]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "data/raw/feedback/normalized").mkdir(parents=True)
            (root / "config").mkdir()
            (root / "reports").mkdir()
            (root / "config/canonical_models.json").write_text(json.dumps({"models": [{"repo_id": "example/model", "id": "example-model"}]}))
            (root / "data/raw/feedback/normalized/input.jsonl").write_text("".join(json.dumps(r) + "\n" for r in rows))
            with mock.patch.object(feedback, "ROOT", root), mock.patch.object(sys, "argv", ["process_feedback.py"]), contextlib.redirect_stdout(io.StringIO()):
                feedback.main()
            output = [json.loads(line) for line in (root / "data/final/feedback.jsonl").read_text().split("\n") if line]
            self.assertEqual(len(output), 2)
            gh = next(r for r in output if r["platform"] == "github")
            hf = next(r for r in output if r["platform"] == "huggingface")
            self.assertGreaterEqual(len(gh["task_ids"]), 2)
            self.assertEqual(gh["model_ids"], [])
            self.assertEqual(gh["attribution_level"], "family")
            self.assertEqual(hf["model_ids"], ["example-model"])
            self.assertEqual(hf["validation_status"], "pending_human_review")
            report = json.loads((root / "reports/feedback_quality.json").read_text())
            self.assertEqual(report["exclusions"], {"duplicate_source_object": 1, "bot": 1, "pull_request": 1})
            self.assertEqual(report["human_validated_count"], 0)

    def test_empty_issue_template_is_not_substantive(self):
        template = "### Describe the issue\nIssue:\nCommand: ```\nPASTE THE COMMANDS HERE.\n```\nLog: ```\nPASTE THE LOGS HERE.\n```\nScreenshots: You may attach screenshots if it better explains the issue."
        self.assertEqual(feedback.analyze_text(template), "")


if __name__ == "__main__":
    unittest.main()
