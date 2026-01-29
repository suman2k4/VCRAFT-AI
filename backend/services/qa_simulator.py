"""
Q&A Simulator Service

Generates VC questions and evaluates founder answers.
"""

import uuid
from typing import List
from models.qa import QuestionRequest, QuestionResponse, AnswerRequest, AnswerEvaluation, Question
from services.llm_service import get_llm_service
from rag.retriever import get_rag_retriever
from prompts.qa_prompts import (
    get_question_generation_prompt,
    get_answer_evaluation_prompt,
    get_qa_system_prompt
)

class QASimulator:
    """
    Q&A simulation service for VC practice.
    """
    
    def __init__(self):
        self.llm_service = get_llm_service()
        self.rag_retriever = get_rag_retriever()
        # In-memory storage for pitch context (in production, use database)
        self.pitch_cache = {}
    
    async def generate_questions(self, request: QuestionRequest, pitch_summary: str) -> QuestionResponse:
        """
        Generate VC questions based on pitch and persona.
        
        Args:
            request: Question generation request
            pitch_summary: Summary of the pitch analysis
            
        Returns:
            List of generated questions
        """
        
        print(f"Generating {request.num_questions} questions for {request.investor_persona}")
        
        # Step 1: Retrieve VC questioning tactics
        rag_context = self.rag_retriever.retrieve_with_context(
            query=f"VC questions for {request.investor_persona} due diligence",
            context_prefix="Relevant VC questioning approaches:",
            top_k=3
        )
        
        # Step 2: Build prompt
        prompt = get_question_generation_prompt(
            pitch_summary=pitch_summary,
            investor_persona=request.investor_persona,
            rag_context=rag_context,
            num_questions=request.num_questions
        )
        
        system_prompt = get_qa_system_prompt()
        
        # Step 3: Generate questions
        result = await self.llm_service.generate(prompt, system_prompt)
        
        # Step 4: Parse and structure
        questions = [
            Question(
                id=q["id"],
                question=q["question"],
                category=q["category"],
                difficulty=q["difficulty"]
            )
            for q in result["questions"]
        ]
        
        print(f"Generated {len(questions)} questions")
        
        return QuestionResponse(questions=questions)
    
    async def evaluate_answer(self, request: AnswerRequest, pitch_context: str, 
                             question_text: str) -> AnswerEvaluation:
        """
        Evaluate founder's answer to VC question.
        
        Args:
            request: Answer evaluation request
            pitch_context: Original pitch context
            question_text: The question that was asked
            
        Returns:
            Evaluation with score and feedback
        """
        
        print(f"Evaluating answer to question: {request.question_id}")
        
        # Step 1: Retrieve VC evaluation criteria
        rag_context = self.rag_retriever.retrieve_with_context(
            query=f"evaluating founder answers {question_text}",
            context_prefix="VC answer evaluation criteria:",
            top_k=3
        )
        
        # Step 2: Build evaluation prompt
        prompt = get_answer_evaluation_prompt(
            question=question_text,
            answer=request.answer,
            pitch_context=pitch_context,
            investor_persona="saas",  # TODO: Get from request
            rag_context=rag_context
        )
        
        system_prompt = get_qa_system_prompt()
        
        # Step 3: Evaluate
        result = await self.llm_service.generate(prompt, system_prompt)
        
        # Step 4: Structure response
        evaluation = AnswerEvaluation(
            score=result["score"],
            feedback=result["feedback"],
            improvement_tips=result["improvement_tips"]
        )
        
        print(f"Answer score: {evaluation.score}/10")
        
        return evaluation
    
    def cache_pitch_context(self, analysis_id: str, pitch_summary: str):
        """Store pitch context for Q&A session."""
        self.pitch_cache[analysis_id] = pitch_summary
    
    def get_pitch_context(self, analysis_id: str) -> str:
        """Retrieve cached pitch context."""
        return self.pitch_cache.get(analysis_id, "")

# Global instance
_qa_simulator = None

def get_qa_simulator() -> QASimulator:
    """Get or create global Q&A simulator instance."""
    global _qa_simulator
    if _qa_simulator is None:
        _qa_simulator = QASimulator()
    return _qa_simulator
