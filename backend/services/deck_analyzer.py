"""
Deck Analyzer — LLM-powered slide classification, quality scoring,
and content improvement for pitch decks.

Pipeline:
  1. classify_slides()  – label each slide (Problem, Solution, Market …)
  2. analyze_deck()     – score & find weak / missing sections
  3. improve_deck()     – rewrite each section for investor readiness

All LLM calls go through the shared ``LLMService`` so the user's
configured provider (Gemini / OpenAI) is honoured automatically.
"""

from __future__ import annotations

import re
import logging
from typing import Dict, List, Any, Optional

from services.llm_service import get_llm_service
from prompts.personas import get_persona_tone

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Canonical pitch-deck sections
# ---------------------------------------------------------------------------

PITCH_SECTIONS = [
    "Problem",
    "Solution",
    "Market",
    "Product",
    "Traction",
    "Business Model",
    "Competition",
    "Go-To-Market",
    "Team",
    "Financials",
    "Ask",
]

# ---------------------------------------------------------------------------
# 1. Slide classification
# ---------------------------------------------------------------------------


async def classify_slides(slides: List[Dict]) -> Dict[str, str]:
    """
    Use the LLM to label every slide with one of the canonical sections
    (or ``"Other"`` if it doesn't fit).

    Args:
        slides: Output of ``file_utils.extract_slides()`` —
                list of ``{"slide_number", "content"}``.

    Returns:
        Dict keyed by section name → concatenated content that belongs
        to that section.  Slides tagged ``"Other"`` are grouped together.
    """
    llm = get_llm_service()

    # Build a compact prompt with all slides
    slides_text = "\n\n".join(
        f"--- Slide {s['slide_number']} ---\n{s['content']}"
        for s in slides
    )

    prompt = f"""You are a pitch-deck expert. Below are the extracted slides from a startup's pitch deck.

For EACH slide, classify it into exactly ONE of these categories:
{', '.join(PITCH_SECTIONS)}, Other

IMPORTANT:
- A slide can only be one category.
- If a slide doesn't fit any category, use "Other".
- If multiple slides belong to the same category, combine their content.

Return a JSON object where:
- Keys = category names from the list above (only include categories that have content)
- Values = the combined text content for that category

Example output:
{{
  "Problem": "content of problem slide(s)",
  "Solution": "content of solution slide(s)",
  "Market": "content of market slide(s)"
}}

--- SLIDES ---
{slides_text}
"""

    system_prompt = (
        "You are an expert pitch deck analyst. Respond ONLY with valid JSON. "
        "No markdown fences, no extra commentary."
    )

    result = await llm.generate(prompt, system_prompt)

    # Normalise keys (LLMs sometimes change casing)
    normalised: Dict[str, str] = {}
    section_lower_map = {s.lower(): s for s in PITCH_SECTIONS + ["Other"]}
    for key, value in result.items():
        canonical = section_lower_map.get(key.lower().strip(), "Other")
        if canonical in normalised:
            normalised[canonical] += "\n" + str(value)
        else:
            normalised[canonical] = str(value)

    logger.info(
        f"[DECK-ANALYZER] Classified slides into {len(normalised)} sections: "
        f"{list(normalised.keys())}"
    )
    return normalised


# ---------------------------------------------------------------------------
# 2. Deck quality analysis
# ---------------------------------------------------------------------------

# Simple heuristic: look for numbers / metrics in text
_HAS_NUMBERS = re.compile(r"\d[\d,.]*[%KMBxX]?")


def _has_metrics(text: str) -> bool:
    """Return True if the text contains numbers that look like metrics."""
    return bool(_HAS_NUMBERS.search(text))


async def analyze_deck(structured_deck: Dict[str, str]) -> Dict[str, Any]:
    """
    Evaluate deck quality.

    Checks performed:
      - Missing canonical sections
      - Sections with weak / absent metrics
      - Overly long slides (> 500 words)
      - No traction evidence
      - LLM-generated overall score and suggestions

    Returns:
        {
            "missing_sections": [...],
            "weak_sections": [...],
            "long_sections": [...],
            "score": 0-100,
            "section_scores": { "Problem": 75, ... },
            "suggestions": [...]
        }
    """
    present = set(structured_deck.keys()) - {"Other"}
    missing = [s for s in PITCH_SECTIONS if s not in present]

    # Weak metrics detection
    weak_sections: List[str] = []
    long_sections: List[str] = []
    for section, content in structured_deck.items():
        if section == "Other":
            continue
        if not _has_metrics(content) and section in (
            "Traction", "Financials", "Market", "Business Model"
        ):
            weak_sections.append(section)
        word_count = len(content.split())
        if word_count > 500:
            long_sections.append(f"{section} ({word_count} words)")

    # Use LLM for deeper analysis + score
    llm = get_llm_service()

    deck_summary = "\n\n".join(
        f"## {section}\n{content}" for section, content in structured_deck.items()
    )

    prompt = f"""You are an expert VC pitch-deck reviewer.

Below is a classified pitch deck. The sections present are: {', '.join(structured_deck.keys())}
Missing sections: {', '.join(missing) if missing else 'None'}
Sections with no clear metrics: {', '.join(weak_sections) if weak_sections else 'None'}
Overly long sections: {', '.join(long_sections) if long_sections else 'None'}

DECK CONTENT:
{deck_summary}

Analyse the deck and respond with JSON:
{{
  "score": <int 0-100 overall quality>,
  "section_scores": {{
    "<section>": <int 0-100>,
    ...
  }},
  "suggestions": [
    "<actionable suggestion 1>",
    "<actionable suggestion 2>",
    ...
  ]
}}

Score guide:
- 90-100: Investor-ready, compelling narrative with strong data
- 70-89:  Good but has gaps or weak storytelling
- 50-69:  Needs significant improvement
- 0-49:   Major issues, incomplete deck

Evaluate EACH present section individually. Provide 3-8 specific, actionable suggestions.
"""

    system_prompt = (
        "You are a senior VC partner reviewing a startup pitch deck. "
        "Be specific and actionable. Respond ONLY with valid JSON."
    )

    llm_result = await llm.generate(prompt, system_prompt)

    return {
        "missing_sections": missing,
        "weak_sections": weak_sections,
        "long_sections": long_sections,
        "score": int(llm_result.get("score", 50)),
        "section_scores": llm_result.get("section_scores", {}),
        "suggestions": llm_result.get("suggestions", []),
    }


# ---------------------------------------------------------------------------
# 3. Content improvement / rewrite
# ---------------------------------------------------------------------------


async def improve_deck(
    structured_deck: Dict[str, str],
    investor_persona: str = "growth_vc",
) -> Dict[str, str]:
    """
    Rewrite each section with concise, investor-ready language tuned to
    ``investor_persona``.

    Args:
        structured_deck: Section name → raw content.
        investor_persona: Key from ``_PERSONA_TONES``.

    Returns:
        Dict with the same keys, values replaced by polished text.
    """
    llm = get_llm_service()

    tone = get_persona_tone(investor_persona)

    deck_json = "\n\n".join(
        f"## {section}\n{content}" for section, content in structured_deck.items()
        if section != "Other"
    )

    prompt = f"""You are a world-class pitch deck writer.

INVESTOR TONE GUIDE:
{tone}

Below are the current sections of a startup pitch deck. Rewrite EVERY section
with concise, impactful, investor-ready language. Each section should be
3-6 bullet points max. Use strong action verbs, include specific numbers
where possible, and ensure a compelling narrative flow.

CURRENT DECK:
{deck_json}

Respond with JSON where keys are section names and values are the rewritten content.
Add any essential sections that are currently missing from:
{', '.join(PITCH_SECTIONS)}

Example:
{{
  "Problem": "rewritten problem content",
  "Solution": "rewritten solution content"
}}
"""

    system_prompt = (
        "You are an elite pitch-deck consultant who has helped raise $500M+ "
        "in venture funding. Respond ONLY with valid JSON."
    )

    result = await llm.generate(prompt, system_prompt)

    # Normalise keys
    improved: Dict[str, str] = {}
    section_lower_map = {s.lower(): s for s in PITCH_SECTIONS}
    for key, value in result.items():
        canonical = section_lower_map.get(key.lower().strip(), key)
        improved[canonical] = str(value)

    logger.info(
        f"[DECK-ANALYZER] Improved deck ({investor_persona}): "
        f"{len(improved)} sections"
    )
    return improved
