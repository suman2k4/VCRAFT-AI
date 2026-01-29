"""
LLM Service - Unified interface for Gemini and OpenAI

Supports:
- Google Gemini (gemini-pro)
- OpenAI (gpt-4, gpt-3.5-turbo)

Forces JSON output and handles parsing.
"""

import json
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
            # Use gemini-1.5-flash without "models/" prefix for v1beta
            self.model_name = "gemini-1.5-flash"
            
            # Configure for JSON output
            self.generation_config = genai.types.GenerateContentConfig(
                temperature=0.7,
                top_p=0.95,
                top_k=40,
                max_output_tokens=2048,
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
    
    async def _generate_gemini(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate with Gemini with HARD TIMEOUT.
        
        CRITICAL FIX: Add 15-second timeout to prevent hanging requests
        """
        try:
            # Combine system prompt and user prompt
            full_prompt = ""
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            else:
                full_prompt = prompt
            
            logger.info(f"[LLM] Calling Gemini API (model: {self.model_name})...")
            
            # CRITICAL FIX: Add timeout to prevent hanging
            # If Gemini doesn't respond in 15 seconds, abort
            try:
                async def _call_gemini():
                    return self.client.models.generate_content(
                        model=self.model_name,
                        contents=full_prompt,
                        config=self.generation_config
                    )
                
                # 15-second hard timeout
                response = await asyncio.wait_for(_call_gemini(), timeout=15.0)
                logger.info("[LLM] ✓ Gemini API responded successfully")
                
            except asyncio.TimeoutError:
                logger.error("[LLM] ✗ Gemini API timeout (15 seconds)")
                raise RuntimeError("LLM request timed out after 15 seconds")
            
            # Extract text
            text = response.text
            logger.info(f"[LLM] Received {len(text)} chars from Gemini")
            
            # Parse JSON
            # Remove markdown code blocks if present
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            # Parse JSON
            result = json.loads(text)
            logger.info("[LLM] ✓ JSON parsed successfully")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"[LLM] ✗ JSON parsing error: {e}")
            logger.error(f"[LLM] Raw response: {text[:500]}")
            raise ValueError(f"LLM did not return valid JSON: {e}")
        except Exception as e:
            logger.error(f"[LLM] ✗ Gemini generation error: {type(e).__name__}: {e}")
            raise RuntimeError(f"Failed to generate with Gemini: {e}")
    
    async def _generate_openai(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """Generate with OpenAI."""
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
                response_format={"type": "json_object"}  # Force JSON output
            )
            
            # Extract and parse JSON
            text = response.choices[0].message.content
            result = json.loads(text)
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw response: {text}")
            raise ValueError(f"LLM did not return valid JSON: {e}")
        except Exception as e:
            print(f"OpenAI generation error: {e}")
            raise RuntimeError(f"Failed to generate with OpenAI: {e}")

# Global instance
_llm_service = None

def get_llm_service() -> LLMService:
    """Get or create global LLM service instance."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
