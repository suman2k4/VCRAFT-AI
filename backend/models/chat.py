"""
Chat Models - Conversational Q&A chatbot models
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str = Field(..., description="'investor' or 'founder'")
    content: str
    score: Optional[int] = Field(None, ge=0, le=10, description="Score for founder answers")
    feedback: Optional[str] = Field(None, description="Feedback for founder answers")
    tips: Optional[List[str]] = Field(None, description="Improvement tips")

class ChatStartRequest(BaseModel):
    """Start a new chatbot Q&A session."""
    pitch_summary: str = Field(..., min_length=30, max_length=50000, description="The startup pitch summary")
    industry: str = Field(..., min_length=2, max_length=100, description="Startup industry")
    investor_persona: str = Field(default="saas", max_length=50, description="Investor type")
    investor_stage: str = Field(default="seed", max_length=50, description="Funding stage")

class ChatStartResponse(BaseModel):
    session_id: str
    investor_name: str
    investor_description: str
    greeting: str

class ChatMessageRequest(BaseModel):
    """Send a message in an existing chat session."""
    session_id: str = Field(..., max_length=128, description="Chat session ID")
    message: str = Field(..., min_length=1, max_length=10000, description="Founder's message")

class ChatMessageResponse(BaseModel):
    """Investor's reply."""
    reply: str
    score: Optional[int] = Field(None, description="Score 0-10 if evaluating an answer")
    feedback: Optional[str] = Field(None, description="Specific feedback")
    tips: Optional[List[str]] = Field(None, description="Improvement suggestions")
    is_question: bool = Field(default=True, description="Whether the reply contains a question")
    session_complete: bool = Field(default=False, description="Whether session is done")
    questions_asked: int = Field(default=0, description="Total questions asked so far")
    avg_score: Optional[float] = Field(None, description="Running average score")
