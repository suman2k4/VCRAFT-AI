from fastapi import APIRouter, HTTPException
from models.pitch import PitchRequest
from models.analysis import AnalysisResponse
from models.qa import QuestionRequest, QuestionResponse, AnswerRequest, AnswerEvaluation
from services.pitch_analyzer import get_pitch_analyzer
from services.qa_simulator import get_qa_simulator
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["api"])

@router.post("/analyze-pitch", response_model=AnalysisResponse)
async def analyze_pitch(pitch_request: PitchRequest):
    """
    Analyze a startup pitch using RAG + LLM.
    
    This endpoint:
    1. Validates input
    2. Retrieves relevant VC knowledge (RAG)
    3. Generates persona-aware analysis
    4. Returns structured feedback
    
    DEFENSIVE ERROR HANDLING:
    - Validates environment variables
    - Handles RAG failures gracefully
    - Ensures JSON output
    - Never crashes the server
    """
    logger.info(f"[ANALYZE-PITCH] Received request for {pitch_request.industry} startup")
    
    try:
        # SAFEGUARD 1: Validate analyzer initialization (checks API keys)
        try:
            analyzer = get_pitch_analyzer()
            logger.info("[ANALYZE-PITCH] Analyzer initialized successfully")
        except ValueError as e:
            logger.error(f"[ANALYZE-PITCH] Environment validation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Server configuration error: {str(e)}. Please check API keys in environment variables."
            )
        except Exception as e:
            logger.error(f"[ANALYZE-PITCH] Analyzer initialization failed: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to initialize analysis service. Please contact support."
            )
        
        # SAFEGUARD 2: Validate pitch data
        validation = analyzer.validate_pitch(pitch_request)
        if not validation["valid"]:
            logger.warning(f"[ANALYZE-PITCH] Validation failed: {validation['errors']}")
            raise HTTPException(status_code=400, detail=validation["errors"])
        
        logger.info(f"[ANALYZE-PITCH] Starting analysis for persona: {pitch_request.investor_persona}")
        
        # SAFEGUARD 3: Analyze with comprehensive error handling
        result = await analyzer.analyze_pitch(pitch_request)
        
        logger.info(f"[ANALYZE-PITCH] Analysis complete. Score: {result.overall_score}")
        
        # Cache pitch context for Q&A
        try:
            qa_sim = get_qa_simulator()
            pitch_summary = f"{pitch_request.startup_idea}\nIndustry: {pitch_request.industry}"
            qa_sim.cache_pitch_context(result.analysis_id, pitch_summary)
            logger.info(f"[ANALYZE-PITCH] Cached context for Q&A: {result.analysis_id}")
        except Exception as e:
            # Non-critical - don't fail the request
            logger.warning(f"[ANALYZE-PITCH] Failed to cache Q&A context: {e}")
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions (already have proper status codes)
        raise
    except ValueError as e:
        # Business logic errors (bad input)
        logger.error(f"[ANALYZE-PITCH] Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # SAFEGUARD 4: Catch-all for unexpected errors
        logger.error(f"[ANALYZE-PITCH] Unexpected error: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during analysis. Please try again or contact support."
        )


@router.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(request: QuestionRequest):
    """
    Generate VC questions based on pitch and investor persona.
    
    Uses RAG to retrieve questioning tactics from VC knowledge base.
    """
    try:
        qa_sim = get_qa_simulator()
        
        # Get pitch context
        pitch_summary = qa_sim.get_pitch_context(request.analysis_id)
        if not pitch_summary:
            raise HTTPException(
                status_code=404,
                detail="Pitch analysis not found. Analyze pitch first."
            )
        
        # Generate questions
        result = await qa_sim.generate_questions(request, pitch_summary)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_questions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during question generation")


@router.post("/evaluate-answer", response_model=AnswerEvaluation)
async def evaluate_answer(request: AnswerRequest):
    """
    Evaluate founder's answer to a VC question.
    
    Provides score (0-10) and actionable feedback.
    """
    try:
        qa_sim = get_qa_simulator()
        
        # Get pitch context
        pitch_context = qa_sim.get_pitch_context(request.analysis_id)
        if not pitch_context:
            raise HTTPException(
                status_code=404,
                detail="Pitch analysis not found"
            )
        
        # For now, we'll use the question_id as the question text
        # In production, store questions in database
        question_text = f"Question {request.question_id}"
        
        # Evaluate answer
        result = await qa_sim.evaluate_answer(request, pitch_context, question_text)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in evaluate_answer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during answer evaluation")
