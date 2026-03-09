"""
Tests for Pydantic input models — validation rules.
"""

import pytest
from pydantic import ValidationError
from models.pitch import PitchRequest, VALID_STAGES, VALID_PERSONAS
from models.qa import QuestionRequest, AnswerRequest
from models.chat import ChatStartRequest, ChatMessageRequest


class TestPitchRequest:
    VALID_DATA = {
        "startup_idea": "x" * 60,  # > 50 chars
        "investor_stage": "seed",
        "investor_persona": "saas",
        "industry": "SaaS",
        "user_id": "uid123",
    }

    def test_valid_request(self):
        req = PitchRequest(**self.VALID_DATA)
        assert req.investor_stage == "seed"

    def test_startup_idea_too_short(self):
        data = {**self.VALID_DATA, "startup_idea": "short"}
        with pytest.raises(ValidationError):
            PitchRequest(**data)

    def test_startup_idea_too_long(self):
        data = {**self.VALID_DATA, "startup_idea": "x" * 60000}
        with pytest.raises(ValidationError):
            PitchRequest(**data)

    def test_invalid_stage(self):
        data = {**self.VALID_DATA, "investor_stage": "series_z"}
        with pytest.raises(ValidationError, match="Invalid funding stage"):
            PitchRequest(**data)

    def test_invalid_persona(self):
        data = {**self.VALID_DATA, "investor_persona": "crypto_bro"}
        with pytest.raises(ValidationError, match="Invalid investor persona"):
            PitchRequest(**data)

    def test_all_valid_stages(self):
        for stage in VALID_STAGES:
            data = {**self.VALID_DATA, "investor_stage": stage}
            req = PitchRequest(**data)
            assert req.investor_stage == stage

    def test_all_valid_personas(self):
        for persona in VALID_PERSONAS:
            data = {**self.VALID_DATA, "investor_persona": persona}
            req = PitchRequest(**data)
            assert req.investor_persona == persona

    def test_optional_pitch_deck_text(self):
        req = PitchRequest(**self.VALID_DATA)
        assert req.pitch_deck_text is None

        data = {**self.VALID_DATA, "pitch_deck_text": "extra context here"}
        req = PitchRequest(**data)
        assert req.pitch_deck_text == "extra context here"


class TestAnswerRequest:
    def test_valid_answer(self):
        req = AnswerRequest(
            question_id="q1",
            answer="A solid answer to the question.",
            analysis_id="abc123",
        )
        assert req.investor_persona == "saas"  # default

    def test_answer_too_short(self):
        with pytest.raises(ValidationError):
            AnswerRequest(question_id="q1", answer="short", analysis_id="abc")

    def test_custom_persona(self):
        req = AnswerRequest(
            question_id="q1",
            answer="A solid answer that is long enough.",
            analysis_id="abc123",
            investor_persona="angel",
        )
        assert req.investor_persona == "angel"


class TestChatMessageRequest:
    def test_message_too_long(self):
        with pytest.raises(ValidationError):
            ChatMessageRequest(session_id="s1", message="x" * 10001)

    def test_empty_message(self):
        with pytest.raises(ValidationError):
            ChatMessageRequest(session_id="s1", message="")

    def test_valid_message(self):
        req = ChatMessageRequest(session_id="s1", message="Hello")
        assert req.message == "Hello"
