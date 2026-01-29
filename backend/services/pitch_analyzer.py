"""
Pitch Analyzer Service

This is where RAG + LLM + Prompts come together.

Flow:
1. Receive pitch data
2. Retrieve relevant VC knowledge (RAG)
3. Build persona-aware prompt
4. Call LLM
5. Parse and return structured analysis

DEFENSIVE DESIGN:
- Validates all environment variables on init
- Handles RAG failures gracefully
- Ensures JSON output with fallbacks
- Never crashes - always returns structured data
"""

import uuid
import logging
from typing import Dict, Any
from models.pitch import PitchRequest
from models.analysis import AnalysisResponse
from services.llm_service import get_llm_service
from rag.retriever import get_rag_retriever
from prompts.analysis_prompts import get_analysis_prompt, get_system_prompt
from config.settings import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PitchAnalyzer:
    """
    Core service for analyzing startup pitches.
    
    This is the HEART of the application with ROBUST error handling.
    """
    
    def __init__(self):
        # SAFEGUARD 1: Validate environment on initialization
        settings = get_settings()
        
        # Check if LLM API key is configured
        if settings.llm_provider == "gemini" and not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not configured in environment variables")
        elif settings.llm_provider == "openai" and not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY not configured in environment variables")
        
        logger.info(f"[PITCH-ANALYZER] Initializing with provider: {settings.llm_provider}")
        
        try:
            self.llm_service = get_llm_service()
            logger.info("[PITCH-ANALYZER] LLM service initialized")
        except Exception as e:
            logger.error(f"[PITCH-ANALYZER] Failed to initialize LLM service: {e}")
            raise ValueError(f"Failed to initialize LLM service: {str(e)}")
        
        try:
            self.rag_retriever = get_rag_retriever()
            logger.info("[PITCH-ANALYZER] RAG retriever initialized")
        except Exception as e:
            logger.error(f"[PITCH-ANALYZER] Failed to initialize RAG retriever: {e}")
            raise ValueError(f"Failed to initialize RAG retriever: {str(e)}")
    
    async def analyze_pitch(self, pitch_request: PitchRequest) -> AnalysisResponse:
        """
        Analyze a startup pitch using RAG + LLM.
        
        This is the complete analysis pipeline with DEFENSIVE ERROR HANDLING:
        1. Retrieve relevant VC knowledge (with fallback)
        2. Build context-aware prompt
        3. Generate analysis via LLM (with retry logic)
        4. Parse JSON safely (with fallback)
        5. Return structured results
        
        Args:
            pitch_request: Pitch data from API
            
        Returns:
            Structured analysis with scores and feedback
            
        Raises:
            ValueError: For invalid input
            Exception: Only after all recovery attempts fail
        """
        
        analysis_id = str(uuid.uuid4())
        logger.info(f"[ANALYSIS-{analysis_id}] Starting analysis for {pitch_request.industry} startup")
        logger.info(f"[ANALYSIS-{analysis_id}] Investor persona: {pitch_request.investor_persona}")
        
        # STEP 1: RAG - Retrieve relevant VC knowledge with fallback
        logger.info(f"[ANALYSIS-{analysis_id}] STEP 1: Retrieving VC knowledge...")
        rag_context = ""
        try:
            query = f"{pitch_request.startup_idea} {pitch_request.industry}"
            rag_context = self.rag_retriever.retrieve_with_context(
                query=query,
                context_prefix="You are analyzing a startup pitch. Use the following VC knowledge:",
                top_k=5
            )
            
            # SAFEGUARD 2: Check if RAG returned meaningful context
            if not rag_context or len(rag_context.strip()) < 50:
                logger.warning(f"[ANALYSIS-{analysis_id}] RAG returned insufficient context (length: {len(rag_context)})")
                # Provide fallback context
                rag_context = """General VC evaluation criteria:
- Problem-solution fit
- Market size and opportunity
- Team capabilities
- Traction and validation
- Business model clarity
- Competitive advantage
- Financial projections
"""
            else:
                logger.info(f"[ANALYSIS-{analysis_id}] RAG retrieved {len(rag_context)} chars of context")
                
        except Exception as e:
            logger.error(f"[ANALYSIS-{analysis_id}] RAG retrieval failed: {e}")
            # Continue with empty context - don't fail the analysis
            rag_context = "No specific VC knowledge retrieved. Using general evaluation principles."
        
        # STEP 2: Build persona-aware prompt
        logger.info(f"[ANALYSIS-{analysis_id}] STEP 2: Building analysis prompt...")
        try:
            prompt = get_analysis_prompt(
                pitch_idea=pitch_request.startup_idea,
                pitch_deck_text=pitch_request.pitch_deck_text or "",
                industry=pitch_request.industry,
                investor_persona=pitch_request.investor_persona,
                rag_context=rag_context
            )
            system_prompt = get_system_prompt()
            logger.info(f"[ANALYSIS-{analysis_id}] Prompt built successfully")
        except Exception as e:
            logger.error(f"[ANALYSIS-{analysis_id}] Prompt building failed: {e}")
            raise ValueError(f"Failed to build analysis prompt: {str(e)}")
        
        # STEP 3: Generate analysis via LLM with error handling
        logger.info(f"[ANALYSIS-{analysis_id}] STEP 3: Generating analysis via LLM...")
        analysis_data = None
        
        try:
            analysis_data = await self.llm_service.generate(prompt, system_prompt)
            logger.info(f"[ANALYSIS-{analysis_id}] LLM generation successful")
            
        except Exception as e:
            logger.error(f"[ANALYSIS-{analysis_id}] LLM generation failed: {type(e).__name__}: {e}")
            
            # SAFEGUARD 3: Return fallback structured response instead of crashing
            logger.warning(f"[ANALYSIS-{analysis_id}] Using fallback analysis due to LLM failure")
            analysis_data = self._create_fallback_analysis(pitch_request, str(e))
        
        # STEP 4: Validate and structure response
        logger.info(f"[ANALYSIS-{analysis_id}] STEP 4: Structuring response...")
        try:
            # SAFEGUARD 4: Validate JSON structure
            if not isinstance(analysis_data, dict):
                raise ValueError(f"Invalid LLM response type: {type(analysis_data)}")
            
            required_fields = ["overall_score", "section_scores", "feedback", "recommendations"]
            missing_fields = [f for f in required_fields if f not in analysis_data]
            
            if missing_fields:
                logger.error(f"[ANALYSIS-{analysis_id}] Missing fields in LLM response: {missing_fields}")
                # Fill in missing fields with defaults
                analysis_data = self._fix_incomplete_analysis(analysis_data, missing_fields)
            
            response = AnalysisResponse(
                analysis_id=analysis_id,
                overall_score=analysis_data["overall_score"],
                section_scores=analysis_data["section_scores"],
                feedback=analysis_data["feedback"],
                recommendations=analysis_data["recommendations"]
            )
            
            logger.info(f"[ANALYSIS-{analysis_id}] Analysis complete. Overall score: {response.overall_score}")
            return response
            
        except Exception as e:
            logger.error(f"[ANALYSIS-{analysis_id}] Response structuring failed: {e}")
            # SAFEGUARD 5: Last resort fallback
            return self._create_emergency_response(analysis_id, pitch_request)
    
    def _create_fallback_analysis(self, pitch_request: PitchRequest, error_msg: str) -> Dict[str, Any]:
        """
        Create a fallback analysis when LLM fails.
        
        Returns basic structured feedback explaining the issue.
        """
        logger.info("[FALLBACK] Creating fallback analysis")
        return {
            "overall_score": 5.0,
            "section_scores": {
                "problem": 5.0,
                "solution": 5.0,
                "market": 5.0,
                "team": 5.0,
                "traction": 5.0
            },
            "feedback": {
                "problem": "Unable to complete full analysis due to a technical issue.",
                "solution": f"Your {pitch_request.industry} solution shows promise. Please try again for detailed feedback.",
                "market": "Market analysis temporarily unavailable.",
                "team": "Team evaluation temporarily unavailable.",
                "traction": "Traction assessment temporarily unavailable."
            },
            "recommendations": [
                "Our analysis service encountered a temporary issue. Please try again in a moment.",
                f"Technical details: {error_msg[:100]}",
                "If this persists, please contact support with your analysis ID."
            ]
        }
    
    def _fix_incomplete_analysis(self, data: Dict[str, Any], missing_fields: list) -> Dict[str, Any]:
        """
        Fill in missing fields in incomplete LLM response.
        """
        logger.info(f"[FIX] Filling missing fields: {missing_fields}")
        
        defaults = {
            "overall_score": 5.0,
            "section_scores": {
                "problem": 5.0,
                "solution": 5.0,
                "market": 5.0,
                "team": 5.0,
                "traction": 5.0
            },
            "feedback": {
                "problem": "Evaluation incomplete",
                "solution": "Evaluation incomplete",
                "market": "Evaluation incomplete",
                "team": "Evaluation incomplete",
                "traction": "Evaluation incomplete"
            },
            "recommendations": ["Please try again for complete analysis"]
        }
        
        for field in missing_fields:
            data[field] = defaults[field]
        
        return data
    
    def _create_emergency_response(self, analysis_id: str, pitch_request: PitchRequest) -> AnalysisResponse:
        """
        Emergency fallback when everything else fails.
        
        Always returns a valid AnalysisResponse - NEVER crashes.
        """
        logger.error("[EMERGENCY] Creating emergency fallback response")
        return AnalysisResponse(
            analysis_id=analysis_id,
            overall_score=5.0,
            section_scores={
                "problem": 5.0,
                "solution": 5.0,
                "market": 5.0,
                "team": 5.0,
                "traction": 5.0
            },
            feedback={
                "problem": "Analysis system temporarily unavailable",
                "solution": f"Your {pitch_request.industry} startup idea has been received",
                "market": "Please try again shortly",
                "team": "Our team is investigating",
                "traction": "Thank you for your patience"
            },
            recommendations=[
                "Our analysis service is experiencing issues. Please try again in a few minutes.",
                "If this problem persists, contact support with this analysis ID.",
                f"Analysis ID: {analysis_id}"
            ]
        )
    
    def validate_pitch(self, pitch_request: PitchRequest) -> Dict[str, Any]:
        """
        Pre-validation of pitch data.
        
        Returns:
            Dict with 'valid' bool and 'errors' list
        """
        errors = []
        
        # Check minimum length
        if len(pitch_request.startup_idea) < 50:
            errors.append("Startup idea must be at least 50 characters")
        
        # Check valid persona
        valid_personas = ['saas', 'angel', 'growth_vc', 'institutional']
        if pitch_request.investor_persona not in valid_personas:
            errors.append(f"Invalid investor persona. Must be one of: {valid_personas}")
        
        # Check valid stage
        valid_stages = ['seed', 'series_a', 'series_b', 'growth']
        if pitch_request.investor_stage not in valid_stages:
            errors.append(f"Invalid investor stage. Must be one of: {valid_stages}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }

# Global instance
_pitch_analyzer = None

def get_pitch_analyzer() -> PitchAnalyzer:
    """Get or create global pitch analyzer instance."""
    global _pitch_analyzer
    if _pitch_analyzer is None:
        _pitch_analyzer = PitchAnalyzer()
    return _pitch_analyzer
