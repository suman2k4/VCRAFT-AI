from pydantic import BaseModel, Field
from typing import List, Optional

class Question(BaseModel):
    id: str
    question: str
    category: str
    difficulty: str  # easy, medium, hard

class QuestionRequest(BaseModel):
    analysis_id: str
    investor_persona: str
    num_questions: int = Field(default=5, ge=1, le=10)
    pitch_summary: Optional[str] = Field(None, description="Pitch summary for context (used when cache is empty)")

class QuestionResponse(BaseModel):
    questions: List[Question]

class AnswerRequest(BaseModel):
    question_id: str
    answer: str = Field(..., min_length=10)
    analysis_id: str
    question_text: Optional[str] = Field(None, description="The question text being answered")
    pitch_summary: Optional[str] = Field(None, description="Pitch summary for context")

class AnswerEvaluation(BaseModel):
    score: int = Field(..., ge=0, le=10)
    feedback: str
    improvement_tips: List[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "score": 8,
                "feedback": "Strong answer with specific metrics. Good use of CAC/LTV ratio.",
                "improvement_tips": [
                    "Consider mentioning your payback period",
                    "Add context about industry benchmarks"
                ]
            }
        }
