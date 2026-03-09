"""
Input Sanitization Utilities

Provides text cleaning and prompt-injection defence for all user inputs
before they reach the LLM prompt pipeline.
"""

from __future__ import annotations

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt-injection patterns (case-insensitive)
# Matches attempts to override system instructions, inject new roles, etc.
# ---------------------------------------------------------------------------

_INJECTION_PATTERNS: list[re.Pattern] = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)",
        r"disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)",
        r"you\s+are\s+now\s+(a|an|the)\s+",
        r"new\s+(system\s+)?instructions?\s*:",
        r"system\s*:\s*you",
        r"<\s*/?\s*system\s*>",
        r"\[INST\]|\[/INST\]",
        r"<<\s*SYS\s*>>",
        r"Human:\s*\n\s*Assistant:",
        r"---\s*BEGIN\s+(SYSTEM|ADMIN)\s+",
    ]
]


def sanitize_text(text: str, *, max_length: int = 50_000, field_name: str = "input") -> str:
    """
    Clean and validate a user-provided text string.

    - Strips leading/trailing whitespace
    - Enforces *max_length* (characters)
    - Removes null bytes and other control characters (keeps newlines & tabs)
    - Logs a warning (does NOT raise) if prompt-injection patterns are detected;
      the text is still returned so the request can proceed, but the warning
      gives operators visibility.

    Parameters
    ----------
    text : str
        Raw user input.
    max_length : int
        Maximum character length.  Excess is silently truncated.
    field_name : str
        Used only for log messages (e.g. ``"startup_idea"``).

    Returns
    -------
    str
        Cleaned text (never longer than *max_length*).
    """
    if not text:
        return text

    # 1. Strip
    text = text.strip()

    # 2. Remove null bytes & non-printable control chars (keep \n \r \t)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # 3. Truncate
    if len(text) > max_length:
        logger.warning(
            f"[SANITIZE] '{field_name}' truncated from {len(text)} to {max_length} chars"
        )
        text = text[:max_length]

    # 4. Prompt-injection scan (warn only — don't block legitimate users)
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            logger.warning(
                f"[SANITIZE] Possible prompt-injection detected in '{field_name}': "
                f"matched pattern {pattern.pattern!r}"
            )
            break  # one warning per field is enough

    return text


def sanitize_field(value: Optional[str], *, max_length: int = 500, field_name: str = "field") -> Optional[str]:
    """Convenience wrapper for short fields (industry, persona, etc.)."""
    if value is None:
        return None
    return sanitize_text(value, max_length=max_length, field_name=field_name)
