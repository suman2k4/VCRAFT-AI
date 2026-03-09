"""
Tests for LLM Service — JSON extraction logic.

These tests do NOT call any external API. They validate the
robust JSON parsing strategy that handles messy LLM outputs.
"""

import pytest
from services.llm_service import LLMService


# ---------------------------------------------------------------------------
# We test the static-like method _extract_json_from_text by instantiating with
# a patched init (we don't need a real API key for parsing tests).
# ---------------------------------------------------------------------------

class FakeLLMService(LLMService):
    """Subclass that skips provider init so we can test parsing only."""
    def __init__(self):
        self.provider = "test"


@pytest.fixture
def svc():
    return FakeLLMService()


# ---- Happy paths -----------------------------------------------------------

class TestCleanJSON:
    def test_plain_json(self, svc):
        text = '{"score": 85, "feedback": "Good pitch"}'
        result = svc._extract_json_from_text(text)
        assert result["score"] == 85
        assert result["feedback"] == "Good pitch"

    def test_json_with_whitespace(self, svc):
        text = '  \n  {"key": "value"}  \n  '
        assert svc._extract_json_from_text(text) == {"key": "value"}


class TestCodeFencedJSON:
    def test_json_code_block(self, svc):
        text = '```json\n{"score": 90}\n```'
        assert svc._extract_json_from_text(text)["score"] == 90

    def test_plain_code_block(self, svc):
        text = '```\n{"score": 70}\n```'
        assert svc._extract_json_from_text(text)["score"] == 70

    def test_commentary_before_block(self, svc):
        text = (
            "Here is my analysis:\n\n"
            "```json\n"
            '{"overall_score": 65, "section_scores": {"problem": 70}}\n'
            "```\n"
            "Let me know if you need anything else."
        )
        result = svc._extract_json_from_text(text)
        assert result["overall_score"] == 65


class TestMixedText:
    def test_json_buried_in_text(self, svc):
        text = (
            "I've analyzed the pitch.\n\n"
            '{"score": 42, "feedback": "Needs work"}\n\n'
            "That's my evaluation."
        )
        assert svc._extract_json_from_text(text)["score"] == 42

    def test_thinking_tags_then_json(self, svc):
        text = (
            "<think>Let me analyze this carefully...</think>\n"
            '{"questions": [{"id": "q1", "question": "Why?", '
            '"category": "market", "difficulty": "hard"}]}'
        )
        result = svc._extract_json_from_text(text)
        assert len(result["questions"]) == 1
        assert result["questions"][0]["id"] == "q1"


class TestNestedJSON:
    def test_nested_objects(self, svc):
        text = '{"section_scores": {"problem_clarity": 80, "market": 75}, "overall": 78}'
        result = svc._extract_json_from_text(text)
        assert result["section_scores"]["problem_clarity"] == 80

    def test_arrays(self, svc):
        text = '{"tips": ["Tip 1", "Tip 2", "Tip 3"]}'
        result = svc._extract_json_from_text(text)
        assert len(result["tips"]) == 3


# ---- Failure cases ----------------------------------------------------------

class TestInvalidJSON:
    def test_no_json_at_all(self, svc):
        with pytest.raises(ValueError, match="Could not extract valid JSON"):
            svc._extract_json_from_text("This is just plain text with no JSON.")

    def test_empty_string(self, svc):
        with pytest.raises(Exception):
            svc._extract_json_from_text("")

    def test_truncated_json(self, svc):
        """Truncated JSON should raise because it's not parseable."""
        with pytest.raises((ValueError, Exception)):
            svc._extract_json_from_text('{"score": 85, "feedback": "Goo')
