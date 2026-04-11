from django.core.cache import cache
from django.contrib.auth import get_user_model

User = get_user_model()
USER_CACHE_TTL = 60 * 15  # 15 mins


def get_cached_user(user_id):
    key = f"user:{user_id}"
    user = cache.get(key)
    if user is None:
        try:
            user = User.objects.get(pk=user_id)
            cache.set(key, user, timeout=USER_CACHE_TTL)
        except User.DoesNotExist:
            return None
    return user


def invalidate_user_cache(user_id):
    cache.delete(f"user:{user_id}")
