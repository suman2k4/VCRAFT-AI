"""
LLM Service - Unified interface for Gemini and OpenAI

Supports:
- Google Gemini (gemini-pro)
- OpenAI (gpt-4, gpt-3.5-turbo)

Forces JSON output and handles parsing.
"""

import json
import re
import os
import asyncio
import logging
from typing import Dict, Any, Optional
from config.settings import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

class LLMService:
    """
    Abstraction layer for LLM APIs.
    
    This allows us to switch between providers without changing business logic.
    """
    
    def __init__(self, provider: str = None):
        """
        Initialize LLM service.
        
        Args:
            provider: 'gemini' or 'openai' (defaults to settings)
        """
        self.provider = provider or settings.llm_provider
        
        if self.provider == "gemini":
            self._init_gemini()
        elif self.provider == "openai":
            self._init_openai()
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")
        
        print(f"Initialized LLM service with provider: {self.provider}")
    
    def _init_gemini(self):
        """Initialize Google Gemini."""
        try:
            from google import genai
            
            api_key = settings.gemini_api_key
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in settings")
            
            self.client = genai.Client(api_key=api_key)
            # Use gemini-2.5-flash (latest, powerful, good for structured output)
            self.model_name = "gemini-2.5-flash"
            
            # Configure for JSON output - high token limit needed for thinking models
            self.generation_config = genai.types.GenerateContentConfig(
                temperature=0.7,
                top_p=0.95,
                top_k=40,
                max_output_tokens=8192,
            )
            
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Gemini: {e}")
    
    def _init_openai(self):
        """Initialize OpenAI."""
        try:
            from openai import OpenAI
            
            api_key = settings.openai_api_key
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in settings")
            
            self.client = OpenAI(api_key=api_key)
            self.model_name = "gpt-4o-mini"  # or gpt-4
            
        except Exception as e:
            raise RuntimeError(f"Failed to initialize OpenAI: {e}")
    
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate response from LLM.
        
        Args:
            prompt: User prompt
            system_prompt: System instruction (optional)
            
        Returns:
            Parsed JSON response
        """
        if self.provider == "gemini":
            return await self._generate_gemini(prompt, system_prompt)
        elif self.provider == "openai":
            return await self._generate_openai(prompt, system_prompt)
    
    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """
        Robustly extract JSON from LLM response text.
        
        Handles:
        - Clean JSON
        - JSON wrapped in ```json``` code blocks
        - JSON mixed with thinking/commentary text
        - Multiple JSON blocks (takes the largest one)
        """
        original_text = text
        text = text.strip()
        
        # Attempt 1: Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Attempt 2: Remove markdown code fences
        cleaned = text
        # Remove ```json ... ``` blocks
        code_block_match = re.search(r'```(?:json)?\s*\n?(\{[\s\S]*?\})\s*```', cleaned)
        if code_block_match:
            try:
                return json.loads(code_block_match.group(1))
            except json.JSONDecodeError:
                pass
        
        # Attempt 3: Find the largest JSON object in the text
        # Look for { ... } patterns, starting from the first { to the last }
        first_brace = text.find('{')
        last_brace = text.rfind('}')
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            json_candidate = text[first_brace:last_brace + 1]
            try:
                return json.loads(json_candidate)
            except json.JSONDecodeError:
                pass
        
        # Attempt 4: Try to find JSON by matching balanced braces
        depth = 0
        start = None
        for i, char in enumerate(text):
            if char == '{':
                if depth == 0:
                    start = i
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0 and start is not None:
                    try:
                        return json.loads(text[start:i + 1])
                    except json.JSONDecodeError:
                        start = None
                        continue
        
        logger.error(f"[LLM] All JSON extraction attempts failed. Raw text: {original_text[:1000]}")
        raise ValueError(f"Could not extract valid JSON from LLM response")

    async def _generate_gemini(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate with Gemini with HARD TIMEOUT and RETRY.
        
        Uses asyncio.to_thread to avoid blocking the event loop with sync SDK calls.
        Includes retry logic for transient failures.
        """
        last_error = None
        max_retries = 2
        
        for attempt in range(max_retries + 1):
            try:
                # Combine system prompt and user prompt
                full_prompt = ""
                if system_prompt:
                    full_prompt = f"{system_prompt}\n\n{prompt}"
                else:
                    full_prompt = prompt
                
                if attempt > 0:
                    # Exponential backoff for retries (especially for rate limits)
                    wait_time = 5 * (2 ** (attempt - 1))  # 5s, 10s
                    logger.info(f"[LLM] Retry attempt {attempt}/{max_retries} after {wait_time}s backoff...")
                    await asyncio.sleep(wait_time)
                logger.info(f"[LLM] Calling Gemini API (model: {self.model_name})...")
                
                # Run sync Gemini SDK call in a thread to avoid blocking event loop
                try:
                    def _call_gemini_sync():
                        return self.client.models.generate_content(
                            model=self.model_name,
                            contents=full_prompt,
                            config=self.generation_config
                        )
                    
                    # 60-second hard timeout (thinking models need more time)
                    response = await asyncio.wait_for(
                        asyncio.to_thread(_call_gemini_sync),
                        timeout=60.0
                    )
                    logger.info("[LLM] ✓ Gemini API responded successfully")
                    
                except asyncio.TimeoutError:
                    logger.error("[LLM] ✗ Gemini API timeout (60 seconds)")
                    last_error = RuntimeError("LLM request timed out after 60 seconds")
                    continue
                
                # Extract text from response
                text = ""
                try:
                    text = response.text
                except Exception:
                    # Some Gemini models return response in candidates
                    if response.candidates and response.candidates[0].content.parts:
                        text = response.candidates[0].content.parts[-1].text
                
                if not text or not text.strip():
                    logger.error("[LLM] ✗ Empty response from Gemini")
                    last_error = RuntimeError("Gemini returned empty response")
                    continue
                
                logger.info(f"[LLM] Received {len(text)} chars from Gemini")
                logger.debug(f"[LLM] Raw response preview: {text[:300]}")
                
                # Extract and parse JSON robustly
                result = self._extract_json_from_text(text)
                logger.info("[LLM] ✓ JSON parsed successfully")
                return result
                
            except json.JSONDecodeError as e:
                logger.error(f"[LLM] ✗ JSON parsing error (attempt {attempt}): {e}")
                last_error = ValueError(f"LLM did not return valid JSON: {e}")
                continue
            except ValueError as e:
                logger.error(f"[LLM] ✗ Value error (attempt {attempt}): {e}")
                last_error = e
                continue
            except Exception as e:
                logger.error(f"[LLM] ✗ Gemini generation error (attempt {attempt}): {type(e).__name__}: {e}")
                last_error = RuntimeError(f"Failed to generate with Gemini: {e}")
                continue
        
        # All retries exhausted
        raise last_error or RuntimeError("LLM generation failed after all retries")
    
    async def _generate_openai(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """Generate with OpenAI. Uses asyncio.to_thread for sync SDK."""
        text = ""
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            # Run sync OpenAI call in thread to avoid blocking event loop
            def _call_openai_sync():
                return self.client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=2048,
                    response_format={"type": "json_object"}  # Force JSON output
                )
            
            response = await asyncio.wait_for(
                asyncio.to_thread(_call_openai_sync),
                timeout=30.0
            )
            
            # Extract and parse JSON
            text = response.choices[0].message.content
            result = json.loads(text)
            return result
            
        except asyncio.TimeoutError:
            logger.error("[LLM] ✗ OpenAI API timeout (30 seconds)")
            raise RuntimeError("LLM request timed out after 30 seconds")
        except json.JSONDecodeError as e:
            logger.error(f"[LLM] JSON parsing error: {e}")
            logger.error(f"[LLM] Raw response: {text[:500]}")
            raise ValueError(f"LLM did not return valid JSON: {e}")
        except Exception as e:
            logger.error(f"[LLM] OpenAI generation error: {e}")
            raise RuntimeError(f"Failed to generate with OpenAI: {e}")

# Global instance
_llm_service = None

def get_llm_service() -> LLMService:
    """Get or create global LLM service instance."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
