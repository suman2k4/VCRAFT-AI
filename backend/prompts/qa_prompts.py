"""
Q&A Simulation Prompts - Generate and Evaluate VC Questions

These prompts power the Q&A simulator feature.
"""

from .personas import get_persona_context

def get_question_generation_prompt(pitch_summary: str, investor_persona: str, 
                                  rag_context: str, num_questions: int = 5) -> str:
    """
    Generate prompt for creating VC questions.
    
    Args:
        pitch_summary: Summary of the analyzed pitch
        investor_persona: Investor type
        rag_context: Retrieved VC knowledge
        num_questions: Number of questions to generate
        
    Returns:
        Question generation prompt
    """
    
    persona_context = get_persona_context(investor_persona)
    
    prompt = f"""
You are a {investor_persona.replace('_', ' ')} preparing to interview a startup founder.

{persona_context}

{rag_context}

STARTUP PITCH SUMMARY:
{pitch_summary}

---

YOUR TASK:
Generate {num_questions} tough but fair questions that this investor would ask based on:
1. The investor persona's priorities
2. Common VC concerns from the knowledge base above
3. Gaps or weaknesses in the pitch

Questions should:
- Test the founder's understanding of their business
- Probe assumptions
- Assess market knowledge
- Evaluate strategic thinking
- Be realistic (what VCs actually ask)

Vary difficulty: include 2 easy, 2 medium, 1 hard question.

Categories:
- business_model: Revenue, pricing, unit economics
- market: Competition, market size, positioning
- product: Features, technology, roadmap
- traction: Metrics, growth, customers
- team: Background, hiring, vision

OUTPUT FORMAT (JSON ONLY):
{{
    "questions": [
        {{
            "id": "q1",
            "question": "<the question>",
            "category": "<category>",
            "difficulty": "<easy|medium|hard>"
        }},
        ...
    ]
}}

Respond ONLY with valid JSON. No other text.
"""
    
    return prompt.strip()


def get_answer_evaluation_prompt(question: str, answer: str, pitch_context: str, 
                                investor_persona: str, rag_context: str) -> str:
    """
    Generate prompt for evaluating founder answers.
    
    Args:
        question: The VC question
        answer: Founder's answer
        pitch_context: Context about the pitch
        investor_persona: Investor type
        rag_context: Retrieved VC knowledge
        
    Returns:
        Answer evaluation prompt
    """
    
    persona_context = get_persona_context(investor_persona)
    
    prompt = f"""
You are evaluating a startup founder's answer to an investor question.

{persona_context}

{rag_context}

PITCH CONTEXT:
{pitch_context}

INVESTOR QUESTION:
{question}

FOUNDER'S ANSWER:
{answer}

---

YOUR TASK:
Evaluate this answer based on:
1. **Clarity**: Is the answer clear and well-structured?
2. **Specificity**: Does it include concrete details, metrics, or examples?
3. **Logic**: Is the reasoning sound?
4. **Completeness**: Does it fully address the question?
5. **Confidence**: Does the founder demonstrate deep knowledge?

Consider what the investor persona cares about most.

Provide:
- Score from 0-10 (10 = excellent VC-ready answer)
- Constructive feedback (2-3 sentences)
- 2-3 specific improvement tips

Scoring guide:
- 9-10: Excellent answer with metrics and clear thinking
- 7-8: Good answer but could be more specific
- 5-6: Adequate but lacks depth
- 3-4: Vague or incomplete
- 0-2: Off-topic or shows lack of understanding

OUTPUT FORMAT (JSON ONLY):
{{
    "score": <integer 0-10>,
    "feedback": "<constructive 2-3 sentence feedback>",
    "improvement_tips": [
        "<specific tip 1>",
        "<specific tip 2>",
        "<specific tip 3>"
    ]
}}

Respond ONLY with valid JSON. No other text.
"""
    
    return prompt.strip()


def get_qa_system_prompt() -> str:
    """
    System prompt for Q&A simulation tasks.
    """
    return """
You are an expert VC partner conducting due diligence on startups.

You ask probing questions that reveal how well founders understand their business.

When evaluating answers, you look for:
- Specific metrics and data
- Clear strategic thinking
- Honest acknowledgment of challenges
- Deep market knowledge
- Realistic projections

You are tough but fair, helping founders prepare for real investor meetings.
""".strip()
