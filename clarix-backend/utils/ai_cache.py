import hashlib
import json
from django.core.cache import cache

AI_CACHE_TTL = 60 * 60 * 2  # 2 hours


def make_cache_key(history: list, model: str) -> str:
    """Key based on full conversation history + model."""
    raw = json.dumps({"history": history, "model": model}, sort_keys=True)
    digest = hashlib.sha256(raw.encode()).hexdigest()[:32]
    return f"ai_response:{digest}"


def get_cached_ai_response(history: list, model: str):
    return cache.get(make_cache_key(history, model))


def cache_ai_response(history: list, model: str, response: str):
    cache.set(make_cache_key(history, model), response, timeout=AI_CACHE_TTL)
