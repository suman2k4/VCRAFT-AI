from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class SectionScore(BaseModel):
    problem_clarity: int = Field(..., ge=0, le=100)
    market_opportunity: int = Field(..., ge=0, le=100)
    revenue_model: int = Field(..., ge=0, le=100)
    competitive_moat: int = Field(..., ge=0, le=100)
    scalability: int = Field(..., ge=0, le=100)

class SectionFeedback(BaseModel):
    problem_clarity: str
    market_opportunity: str
    revenue_model: str
    competitive_moat: str
    scalability: str

class AnalysisResponse(BaseModel):
    analysis_id: str
    overall_score: int = Field(..., ge=0, le=100)
    section_scores: Dict[str, int]
    feedback: Dict[str, str]
    recommendations: List[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "analysis_id": "abc123",
                "overall_score": 75,
                "section_scores": {
                    "problem_clarity": 80,
                    "market_opportunity": 70,
                    "revenue_model": 75,
                    "competitive_moat": 65,
                    "scalability": 85
                },
                "feedback": {
                    "problem_clarity": "Strong problem definition with clear pain points...",
                    "market_opportunity": "Market size is compelling but needs more validation..."
                },
                "recommendations": [
                    "Add specific metrics on market validation",
                    "Strengthen competitive differentiation"
                ]
            }
        }
