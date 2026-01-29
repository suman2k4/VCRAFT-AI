"""
Pitch Analysis Prompts - Persona-Aware with RAG Context

These prompts are engineered to:
1. Use RAG-retrieved VC knowledge
2. Adapt to investor persona
3. Force structured JSON output
4. Provide actionable, specific feedback
"""

from .personas import get_persona_context

def get_analysis_prompt(pitch_idea: str, pitch_deck_text: str, industry: str, 
                       investor_persona: str, rag_context: str) -> str:
    """
    Generate the full pitch analysis prompt.
    
    This is the CORE prompt that drives the analysis quality.
    
    Args:
        pitch_idea: Startup description
        pitch_deck_text: Additional pitch details
        industry: Startup industry
        investor_persona: Investor type
        rag_context: Retrieved VC knowledge
        
    Returns:
        Complete prompt string
    """
    
    persona_context = get_persona_context(investor_persona)
    
    prompt = f"""
You are an expert venture capital analyst evaluating a startup pitch.

{persona_context}

{rag_context}

STARTUP PITCH TO EVALUATE:
Industry: {industry}

Pitch:
{pitch_idea}

Additional Details:
{pitch_deck_text if pitch_deck_text else 'Not provided'}

---

YOUR TASK:
Evaluate this pitch using ONLY the VC knowledge provided above. Do NOT hallucinate or use external knowledge.

Analyze the pitch across these dimensions:
1. **Problem Clarity**: How well-defined is the problem? Is it significant and painful?
2. **Market Opportunity**: Is the market large enough? Is the sizing credible?
3. **Revenue Model**: Is the business model clear and sustainable? Are unit economics sound?
4. **Competitive Moat**: What prevents competition? Is there defensibility?
5. **Scalability**: Can this business scale efficiently?

For each dimension:
- Provide a score from 0-100
- Write 2-3 sentences of specific, actionable feedback
- Reference the VC knowledge provided above
- Consider the investor persona's priorities

CRITICAL REQUIREMENTS:
- Use ONLY the VC knowledge provided above
- If information is insufficient, say "Insufficient detail provided on [aspect]"
- Be specific, not generic
- Provide actionable recommendations
- Match the evaluation criteria to the investor persona
- Calculate an overall score (weighted average of sections)

OUTPUT FORMAT (JSON ONLY):
{{
    "overall_score": <integer 0-100>,
    "section_scores": {{
        "problem_clarity": <integer 0-100>,
        "market_opportunity": <integer 0-100>,
        "revenue_model": <integer 0-100>,
        "competitive_moat": <integer 0-100>,
        "scalability": <integer 0-100>
    }},
    "feedback": {{
        "problem_clarity": "<specific feedback>",
        "market_opportunity": "<specific feedback>",
        "revenue_model": "<specific feedback>",
        "competitive_moat": "<specific feedback>",
        "scalability": "<specific feedback>"
    }},
    "recommendations": [
        "<actionable recommendation 1>",
        "<actionable recommendation 2>",
        "<actionable recommendation 3>",
        "<actionable recommendation 4>"
    ]
}}

Respond ONLY with valid JSON. No other text.
"""
    
    return prompt.strip()


def get_system_prompt() -> str:
    """
    System prompt to set the LLM's role.
    
    This is sent as the system message (if supported by the LLM).
    """
    return """
You are an expert venture capital analyst with 15+ years of experience evaluating startup pitches.

You provide honest, constructive feedback based on proven VC frameworks (YC, Sequoia, a16z).

Your analysis is:
- Grounded in provided knowledge (no hallucinations)
- Specific and actionable
- Tailored to the investor persona
- Output in strict JSON format

You are helping founders improve their pitches, so be encouraging but honest.
""".strip()
