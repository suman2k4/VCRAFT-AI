from pydantic import BaseModel, Field
from typing import Optional

class PitchRequest(BaseModel):
    startup_idea: str = Field(..., min_length=50, description="Detailed startup description")
    pitch_deck_text: Optional[str] = Field(None, description="Additional pitch deck content")
    investor_stage: str = Field(..., description="Funding stage: seed, series_a, series_b, growth")
    investor_persona: str = Field(..., description="Investor type: saas, angel, growth_vc, institutional")
    industry: str = Field(..., min_length=2, description="Startup industry")
    user_id: str = Field(..., description="Firebase user ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "startup_idea": "We're building an AI-powered tool that helps founders analyze their pitch decks...",
                "pitch_deck_text": "Market size: $10B TAM, 500K users in beta...",
                "investor_stage": "seed",
                "investor_persona": "saas",
                "industry": "SaaS",
                "user_id": "firebase_uid_123"
            }
        }
