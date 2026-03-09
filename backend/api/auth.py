"""
Firebase Authentication Middleware for FastAPI.

Provides:
  - Firebase Admin SDK initialization
  - ``get_current_user`` dependency for token verification
  - ``optional_auth`` dependency for routes that work with or without auth

Usage:
    from api.auth import get_current_user, optional_auth

    @router.post("/protected")
    async def protected_endpoint(user: dict = Depends(get_current_user)):
        uid = user["uid"]
        ...

    @router.get("/optional")
    async def optional_endpoint(user: dict | None = Depends(optional_auth)):
        ...
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config.settings import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Firebase Admin SDK initialization (runs once on first import)
# ---------------------------------------------------------------------------

_firebase_app: Optional[firebase_admin.App] = None

def _init_firebase() -> Optional[firebase_admin.App]:
    """Initialize Firebase Admin SDK if not already done."""
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    # Already initialized by another module?
    try:
        _firebase_app = firebase_admin.get_app()
        logger.info("[AUTH] Firebase Admin already initialized")
        return _firebase_app
    except ValueError:
        pass  # Not yet initialized — do it now

    settings = get_settings()
    cred_path = settings.firebase_credentials_path

    try:
        if cred_path and os.path.isfile(cred_path):
            cred = credentials.Certificate(cred_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info(f"[AUTH] Firebase Admin initialized with credentials: {cred_path}")
        elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            # GCP default credentials (e.g. Cloud Run, App Engine)
            _firebase_app = firebase_admin.initialize_app()
            logger.info("[AUTH] Firebase Admin initialized with default credentials")
        else:
            logger.warning(
                "[AUTH] No Firebase credentials found. "
                "Set FIREBASE_CREDENTIALS_PATH or GOOGLE_APPLICATION_CREDENTIALS. "
                "Auth verification will be DISABLED (development mode)."
            )
            return None
    except Exception as exc:
        logger.error(f"[AUTH] Firebase Admin initialization failed: {exc}", exc_info=True)
        return None

    return _firebase_app


# Eagerly try to initialize on import
_init_firebase()

# ---------------------------------------------------------------------------
# Security scheme
# ---------------------------------------------------------------------------

_bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

async def get_current_user(
    request: Request,
    cred: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> dict:
    """
    FastAPI dependency — **requires** a valid Firebase ID token.

    Returns a dict with at least ``uid``, ``email``, and the full
    decoded token under ``token``.

    Raises 401 if the token is missing or invalid.

    In development mode (no Firebase credentials configured), this
    allows all requests through with a placeholder user so local
    development is not blocked.
    """
    # --- Development bypass when Firebase is not configured ---
    if _firebase_app is None:
        settings = get_settings()
        if settings.environment == "development":
            logger.debug("[AUTH] Dev mode — skipping token verification")
            return {
                "uid": "dev-user",
                "email": "dev@localhost",
                "token": {},
            }
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured.",
        )

    # --- Token required ---
    if cred is None or not cred.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_str = cred.credentials

    try:
        decoded = firebase_auth.verify_id_token(token_str, app=_firebase_app)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as exc:
        logger.error(f"[AUTH] Token verification failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "uid": decoded.get("uid", ""),
        "email": decoded.get("email", ""),
        "token": decoded,
    }


async def optional_auth(
    request: Request,
    cred: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> Optional[dict]:
    """
    Like ``get_current_user`` but returns ``None`` instead of raising
    401 when credentials are missing. Useful for endpoints that
    optionally personalise responses for logged-in users.
    """
    if cred is None or not cred.credentials:
        return None

    try:
        return await get_current_user(request, cred)
    except HTTPException:
        return None
