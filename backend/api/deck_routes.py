"""
Deck API Routes — Upload, analyse, improve, and download pitch decks.

Endpoints:
  POST /api/upload-deck           → Upload PPTX/PDF, extract slides
  POST /api/analyze-deck          → Classify + score an extracted deck
  POST /api/generate-refined-deck → Improve content + build downloadable PPTX
"""

from __future__ import annotations

import os
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse

from services.file_utils import validate_file, extract_slides
from services.deck_analyzer import classify_slides, analyze_deck, improve_deck
from services.deck_generator import generate_pptx
from services.session_store import get_deck_store
from api.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["deck"])

# Persistent store for extracted decks (keyed by deck_id)
_deck_store = get_deck_store()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


# ---------------------------------------------------------------------------
# POST /upload-deck
# ---------------------------------------------------------------------------

@router.post("/upload-deck")
async def upload_deck(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """
    Upload a PPTX or PDF pitch deck.

    - Validates file type (.pptx, .pdf) and size (≤ 10 MB).
    - Temporarily saves the file, extracts slide content, then deletes it.
    - Returns structured slide data + a ``deck_id`` for follow-up calls.
    """
    filename = file.filename or "upload"
    logger.info(f"[UPLOAD-DECK] Received file: {filename}")

    # ---------- Read & validate ----------
    contents = await file.read()
    try:
        validate_file(filename, len(contents))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # ---------- Save temporarily ----------
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(filename)[1].lower()
    tmp_name = f"{uuid.uuid4().hex}{ext}"
    tmp_path = os.path.join(UPLOAD_DIR, tmp_name)

    try:
        with open(tmp_path, "wb") as f:
            f.write(contents)

        # ---------- Extract slides ----------
        slides = extract_slides(tmp_path)

    except Exception as exc:
        logger.error(f"[UPLOAD-DECK] Extraction error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to extract slides. The file may be corrupted or in an unsupported format.",
        )
    finally:
        # Always clean up the uploaded file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            logger.info(f"[UPLOAD-DECK] Cleaned up temp file: {tmp_name}")

    # ---------- Store & respond ----------
    deck_id = uuid.uuid4().hex[:12]
    _deck_store.set(deck_id, {
        "filename": filename,
        "slides": slides,
        "structured": None,
        "analysis": None,
        "improved": None,
    })

    total_chars = sum(len(s["content"]) for s in slides)
    logger.info(
        f"[UPLOAD-DECK] deck_id={deck_id}  "
        f"slides={len(slides)}  chars={total_chars}"
    )

    return {
        "deck_id": deck_id,
        "filename": filename,
        "total_slides": len(slides),
        "total_characters": total_chars,
        "slides": slides,
    }


# ---------------------------------------------------------------------------
# POST /analyze-deck
# ---------------------------------------------------------------------------

@router.post("/analyze-deck")
async def analyze_deck_endpoint(
    deck_id: str = Form(...),
    investor_persona: str = Form("growth_vc"),
    user: dict = Depends(get_current_user),
):
    """
    Classify slides into sections, then score the deck.

    Requires a ``deck_id`` from a previous ``/upload-deck`` call.
    """
    entry = _deck_store.get(deck_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Deck not found. Please upload again.")

    slides = entry["slides"]
    logger.info(f"[ANALYZE-DECK] deck_id={deck_id}, persona={investor_persona}")

    try:
        # Step 1: Classify slides
        structured = await classify_slides(slides)
        entry["structured"] = structured

        # Step 2: Score & find issues
        analysis = await analyze_deck(structured)
        entry["analysis"] = analysis

        # Persist updated entry
        _deck_store.update(deck_id, entry)

        return {
            "deck_id": deck_id,
            "structured_sections": structured,
            "analysis": analysis,
        }
    except Exception as exc:
        logger.error(f"[ANALYZE-DECK] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Deck analysis failed. Please try again.")


# ---------------------------------------------------------------------------
# POST /generate-refined-deck
# ---------------------------------------------------------------------------

@router.post("/generate-refined-deck")
async def generate_refined_deck_endpoint(
    deck_id: str = Form(...),
    investor_persona: str = Form("growth_vc"),
    startup_name: str = Form("Your Startup"),
    user: dict = Depends(get_current_user),
):
    """
    Improve deck content with LLM, then generate a downloadable PPTX.

    Pipeline:
      1. Retrieve classified deck (or classify now if needed)
      2. ``improve_deck()`` — rewrite for the chosen persona
      3. ``generate_pptx()`` — build polished .pptx
      4. Return file for download
      5. Schedule file cleanup
    """
    entry = _deck_store.get(deck_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Deck not found. Please upload again.")

    logger.info(
        f"[GENERATE-DECK] deck_id={deck_id}, persona={investor_persona}, "
        f"name={startup_name}"
    )

    try:
        # Ensure we have classified sections
        structured = entry.get("structured")
        if not structured:
            structured = await classify_slides(entry["slides"])
            entry["structured"] = structured

        # Improve content
        improved = await improve_deck(structured, investor_persona)
        entry["improved"] = improved

        # Persist updated entry
        _deck_store.update(deck_id, entry)

        # Generate PPTX
        file_path = generate_pptx(improved, UPLOAD_DIR, startup_name)

        logger.info(f"[GENERATE-DECK] File ready: {file_path}")

        # Return as download — schedule cleanup via background task
        return FileResponse(
            path=file_path,
            filename=os.path.basename(file_path),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            background=_cleanup_file(file_path),
        )

    except Exception as exc:
        logger.error(f"[GENERATE-DECK] Error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Deck generation failed. Please try again.",
        )


# ---------------------------------------------------------------------------
# Cleanup helper
# ---------------------------------------------------------------------------

from starlette.background import BackgroundTask


def _cleanup_file(path: str) -> BackgroundTask:
    """Return a Starlette BackgroundTask that deletes a file after response."""

    def _delete():
        try:
            if os.path.exists(path):
                os.remove(path)
                logger.info(f"[CLEANUP] Deleted generated file: {path}")
        except Exception as exc:
            logger.warning(f"[CLEANUP] Failed to delete {path}: {exc}")

    return BackgroundTask(_delete)
