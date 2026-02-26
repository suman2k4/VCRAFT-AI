"""
Chatbot Service - Conversational VC Q&A powered by Gemini Flash

Manages multi-turn conversations where a VC investor persona
asks tough questions and evaluates founder responses in real-time.
"""

import uuid
import json
import asyncio
import logging
from typing import Dict, Any, Optional, List
from services.llm_service import get_llm_service
from rag.retriever import get_rag_retriever
from prompts.personas import get_persona, get_persona_context
from config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ChatSession:
    """Represents a single chatbot Q&A session with conversation history."""

    def __init__(self, session_id: str, pitch_summary: str, industry: str,
                 investor_persona: str, investor_stage: str):
        self.session_id = session_id
        self.pitch_summary = pitch_summary
        self.industry = industry
        self.investor_persona = investor_persona
        self.investor_stage = investor_stage
        self.history: List[Dict[str, str]] = []  # {role, content}
        self.scores: List[int] = []
        self.questions_asked = 0
        self.max_questions = 7

    def add_message(self, role: str, content: str):
        self.history.append({"role": role, "content": content})

    def get_avg_score(self) -> Optional[float]:
        if not self.scores:
            return None
        return round(sum(self.scores) / len(self.scores), 1)

    def is_complete(self) -> bool:
        return self.questions_asked >= self.max_questions


class ChatbotService:
    """
    Manages VC chatbot Q&A sessions.

    Each session is a multi-turn conversation where the AI acts as
    an investor persona, asks probing questions, and evaluates answers.
    """

    def __init__(self):
        self.llm_service = get_llm_service()
        self.rag_retriever = get_rag_retriever()
        self.sessions: Dict[str, ChatSession] = {}

    def create_session(self, pitch_summary: str, industry: str,
                       investor_persona: str, investor_stage: str) -> ChatSession:
        session_id = str(uuid.uuid4())[:8]
        session = ChatSession(
            session_id=session_id,
            pitch_summary=pitch_summary,
            industry=industry,
            investor_persona=investor_persona,
            investor_stage=investor_stage,
        )
        self.sessions[session_id] = session
        logger.info(f"[CHAT] Created session {session_id} for {investor_persona}")
        return session

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        return self.sessions.get(session_id)

    async def generate_greeting(self, session: ChatSession) -> str:
        """Generate the investor's opening greeting and first question."""
        persona = get_persona(session.investor_persona)
        persona_ctx = get_persona_context(session.investor_persona)

        # Get relevant VC knowledge
        rag_context = self.rag_retriever.retrieve_with_context(
            query=f"VC due diligence questions for {session.industry} {session.investor_stage}",
            context_prefix="VC Knowledge:",
            top_k=3
        )

        prompt = f"""
{persona_ctx}

{rag_context}

STARTUP PITCH:
{session.pitch_summary}
Industry: {session.industry}
Stage: {session.investor_stage}

---

You are {persona['name']} about to interview this founder. 

Write a brief, warm but professional greeting (2-3 sentences) introducing yourself 
and your investment focus. Then ask your FIRST probing question about the startup.

The question should be relevant to the pitch and aligned with your investor persona priorities.

OUTPUT FORMAT (JSON ONLY):
{{
    "greeting": "<your greeting text>",
    "question": "<your first question>"
}}

Respond ONLY with valid JSON.
"""

        system_prompt = f"""You are {persona['name']}, a real venture capital investor conducting 
a live Q&A session with a startup founder. Stay in character throughout.
You are tough but fair, direct but encouraging. Ask one question at a time.
Always respond in valid JSON format."""

        result = await self.llm_service.generate(prompt, system_prompt)
        greeting = result.get("greeting", "Thanks for meeting with me today.")
        question = result.get("question", "Tell me about the problem you're solving.")
        
        full_message = f"{greeting}\n\n{question}"
        session.add_message("investor", full_message)
        session.questions_asked = 1
        
        return full_message

    async def process_founder_message(self, session: ChatSession, 
                                       founder_message: str) -> Dict[str, Any]:
        """
        Process a founder's reply and generate the investor's next response.

        The investor will:
        1. Evaluate the answer (score + feedback)  
        2. Ask a follow-up question OR wrap up the session
        """
        session.add_message("founder", founder_message)

        persona = get_persona(session.investor_persona)
        persona_ctx = get_persona_context(session.investor_persona)

        # Retrieve relevant VC knowledge
        rag_context = self.rag_retriever.retrieve_with_context(
            query=f"evaluating {session.industry} startup founder answers due diligence",
            context_prefix="VC Knowledge:",
            top_k=3
        )

        # Build conversation history string
        conv_history = ""
        for msg in session.history:
            role_label = "INVESTOR" if msg["role"] == "investor" else "FOUNDER"
            conv_history += f"{role_label}: {msg['content']}\n\n"

        is_final = session.questions_asked >= session.max_questions - 1

        if is_final:
            next_action = """This is the FINAL exchange. After evaluating this answer:
- Provide a brief closing summary of the session
- Mention 1-2 key strengths you observed  
- Mention 1-2 areas to improve
- Do NOT ask another question
- Set "is_question" to false"""
        else:
            next_action = """After evaluating this answer:
- Ask a NEW probing follow-up question based on the conversation so far
- The question should dig deeper or explore a new area
- Set "is_question" to true"""

        prompt = f"""
{persona_ctx}

{rag_context}

STARTUP PITCH:
{session.pitch_summary}
Industry: {session.industry}

CONVERSATION SO FAR:
{conv_history}

---

The founder just responded to your latest question. You must:

1. EVALUATE their latest answer:
   - Score from 0-10 (10 = excellent VC-ready answer)
   - Scoring guide: 9-10 excellent with metrics, 7-8 good but could improve, 
     5-6 adequate but lacks depth, 3-4 vague, 0-2 off-topic
   - Write 1-2 sentences of specific feedback
   - Provide 1-2 actionable improvement tips

2. {next_action}

CRITICAL: Stay in character as {persona['name']}. Be conversational, not robotic.
Your reply should feel like a real investor conversation.

OUTPUT FORMAT (JSON ONLY):
{{
    "score": <integer 0-10>,
    "feedback": "<specific 1-2 sentence feedback on their answer>",
    "tips": ["<tip 1>", "<tip 2>"],
    "reply": "<your conversational response including evaluation acknowledgment and next question (or closing remarks)>",
    "is_question": <true/false>
}}

Respond ONLY with valid JSON. No other text.
"""

        system_prompt = f"""You are {persona['name']}, conducting a live VC interview. 
Stay in character. Be conversational and natural - like a real investor meeting.
Evaluate honestly but constructively. Always respond in valid JSON."""

        try:
            result = await self.llm_service.generate(prompt, system_prompt)
        except Exception as e:
            logger.error(f"[CHAT] LLM error: {e}")
            result = {
                "score": 5,
                "feedback": "I appreciate your response. Let me think about that.",
                "tips": ["Try to be more specific with metrics"],
                "reply": "That's an interesting perspective. Can you tell me more about your competitive advantage?",
                "is_question": True
            }

        score = result.get("score", 5)
        feedback = result.get("feedback", "")
        tips = result.get("tips", [])
        reply = result.get("reply", "")
        is_question = result.get("is_question", True)

        session.scores.append(score)
        if is_question:
            session.questions_asked += 1

        session.add_message("investor", reply)

        session_complete = is_final or session.is_complete()

        return {
            "reply": reply,
            "score": score,
            "feedback": feedback,
            "tips": tips,
            "is_question": is_question,
            "session_complete": session_complete,
            "questions_asked": session.questions_asked,
            "avg_score": session.get_avg_score(),
        }


# Global singleton
_chatbot_service = None


def get_chatbot_service() -> ChatbotService:
    """Get or create global chatbot service instance."""
    global _chatbot_service
    if _chatbot_service is None:
        _chatbot_service = ChatbotService()
    return _chatbot_service
