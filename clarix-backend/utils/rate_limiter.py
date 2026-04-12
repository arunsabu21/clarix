from django.core.cache import cache


def is_rate_limited(key: str, limit: int, window: int) -> bool:
    current = cache.get(key)

    if current is None:
        cache.set(key, 1, timeout=window)
        return False

    if current >= limit:
        return True

    cache.incr(key)
    return False


def get_rate_limit_key(limit_type: str, identifier: str) -> str:
    return f"rate_limit:{limit_type}:{identifier}"


def get_remaining_requests(key: str, limit: int) -> int:
    current = cache.get(key) or 0
    return max(0, limit - current)


def get_client_ip(request) -> str:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")



# RATE LIMIT CONFIGS
RATE_LIMITS = {
    "otp": {
        "limit": 5,
        "window": 60 * 60,
        "message": "You've reached the maximum number of OTP requests. For your account's security, please wait 1 hour before requesting a new code.",
    },
    "ai_message": {
        "limit": 20,
        "window": 60 * 60,
        "message": "Message limit reached. Please wait before sending more.",
    },
    "verify_otp": {
        "limit": 10,
        "window": 60 * 60,
        "message": "Too many verification attempts from your device. Please wait 1 hour before trying again.",
    },
}
