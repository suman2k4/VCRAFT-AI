from pydantic import BaseModel, Field, field_validator
from typing import Optional

VALID_STAGES = {"seed", "series_a", "series_b", "growth"}
VALID_PERSONAS = {"saas", "angel", "growth_vc", "institutional", "deep_tech", "impact"}

class PitchRequest(BaseModel):
    startup_idea: str = Field(..., min_length=50, max_length=50000, description="Detailed startup description")
    pitch_deck_text: Optional[str] = Field(None, max_length=100000, description="Additional pitch deck content")
    investor_stage: str = Field(..., description="Funding stage: seed, series_a, series_b, growth")
    investor_persona: str = Field(..., description="Investor type: saas, angel, growth_vc, institutional, deep_tech, impact")
    industry: str = Field(..., min_length=2, max_length=100, description="Startup industry")
    user_id: str = Field(..., max_length=128, description="Firebase user ID")

    @field_validator("investor_stage")
    @classmethod
    def validate_stage(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_STAGES:
            raise ValueError(f"Invalid funding stage '{v}'. Must be one of: {', '.join(sorted(VALID_STAGES))}")
        return v

    @field_validator("investor_persona")
    @classmethod
    def validate_persona(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_PERSONAS:
            raise ValueError(f"Invalid investor persona '{v}'. Must be one of: {', '.join(sorted(VALID_PERSONAS))}")
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "startup_idea": "We're building an AI-powered tool that helps founders analyze their pitch decks...",
                "pitch_deck_text": "Market size: $10B TAM, 500K users in beta...",
                "investor_stage": "seed",
                "investor_persona": "saas",
                "industry": "SaaS",
                "user_id": "firebase_uid_123"
            }
        }
    }
