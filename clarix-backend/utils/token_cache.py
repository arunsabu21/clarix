from django.core.cache import cache

BLACKLIST_PREFIX = "jwt_blacklist"
BLACKLIST_TTL = 60 * 60 * 24 * 7 # 7 days


def blacklist_token(jti: str, ttl: int = BLACKLIST_TTL):
    """Add a JTI to the Redis blacklist."""
    cache.set(f"{BLACKLIST_PREFIX}:{jti}", True, timeout=ttl)


def is_token_blacklisted(jti: str) -> bool:
    """Check Redis first - falls back to DB only on cache miss."""
    return cache.get(f"{BLACKLIST_PREFIX}:{jti}") is not None