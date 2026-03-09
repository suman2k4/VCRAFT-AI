"""
Persistent session store with TTL support.

Replaces volatile in-memory dicts that are lost on server restart.
Uses a JSON file on disk for durability with automatic expiry cleanup.
"""

import json
import os
import time
import logging
import threading
from typing import Any, Optional, Dict

logger = logging.getLogger(__name__)

_DEFAULT_TTL = 3600  # 1 hour default
_STORE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


class SessionStore:
    """Thread-safe, file-backed key-value store with TTL expiry."""

    def __init__(self, name: str, ttl: int = _DEFAULT_TTL):
        self.name = name
        self.ttl = ttl
        self._lock = threading.Lock()
        os.makedirs(_STORE_DIR, exist_ok=True)
        self._path = os.path.join(_STORE_DIR, f"{name}.json")
        self._data: Dict[str, dict] = self._load()
        logger.info(f"[STORE] Loaded '{name}' with {len(self._data)} entries")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def set(self, key: str, value: Any) -> None:
        """Store a value with automatic TTL."""
        with self._lock:
            self._data[key] = {
                "value": value,
                "expires": time.time() + self.ttl,
            }
            self._persist()

    def get(self, key: str) -> Optional[Any]:
        """Retrieve a value. Returns None if expired or missing."""
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                return None
            if time.time() > entry["expires"]:
                del self._data[key]
                self._persist()
                return None
            return entry["value"]

    def delete(self, key: str) -> None:
        """Remove a key."""
        with self._lock:
            self._data.pop(key, None)
            self._persist()

    def update(self, key: str, value: Any) -> None:
        """Update value without resetting TTL."""
        with self._lock:
            entry = self._data.get(key)
            if entry and time.time() <= entry["expires"]:
                entry["value"] = value
                self._persist()

    def exists(self, key: str) -> bool:
        return self.get(key) is not None

    def cleanup(self) -> int:
        """Remove all expired entries. Returns count removed."""
        now = time.time()
        with self._lock:
            expired = [k for k, v in self._data.items() if now > v["expires"]]
            for k in expired:
                del self._data[k]
            if expired:
                self._persist()
            return len(expired)

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _load(self) -> Dict[str, dict]:
        if not os.path.exists(self._path):
            return {}
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Purge already-expired entries on load
            now = time.time()
            return {k: v for k, v in data.items() if now <= v.get("expires", 0)}
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning(f"[STORE] Failed to load {self._path}: {exc}")
            return {}

    def _persist(self) -> None:
        try:
            with open(self._path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, default=str)
        except OSError as exc:
            logger.error(f"[STORE] Failed to persist {self._path}: {exc}")


# ------------------------------------------------------------------
# Pre-built stores for each feature
# ------------------------------------------------------------------

_deck_store_instance: Optional[SessionStore] = None
_chat_store_instance: Optional[SessionStore] = None
_pitch_cache_instance: Optional[SessionStore] = None


def get_deck_store() -> SessionStore:
    """Deck upload data store (2-hour TTL)."""
    global _deck_store_instance
    if _deck_store_instance is None:
        _deck_store_instance = SessionStore("deck_sessions", ttl=7200)
    return _deck_store_instance


def get_chat_store() -> SessionStore:
    """Chatbot session store (1-hour TTL)."""
    global _chat_store_instance
    if _chat_store_instance is None:
        _chat_store_instance = SessionStore("chat_sessions", ttl=3600)
    return _chat_store_instance


def get_pitch_cache() -> SessionStore:
    """QA pitch context cache (1-hour TTL)."""
    global _pitch_cache_instance
    if _pitch_cache_instance is None:
        _pitch_cache_instance = SessionStore("pitch_cache", ttl=3600)
    return _pitch_cache_instance
