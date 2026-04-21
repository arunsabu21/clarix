from upgrade.models import Subscription, Plan


def get_rate_limits_for_user(user):
    try:
        sub = Subscription.objects.get(user=user)
        plan = sub.plan
    except Subscription.DoesNotExist:
        plan = Plan.FREE

    if plan == Plan.FREE:
        return {"limit": 6, "window": 3600}
    else:
        return {"limit": 10000, "window": 3600}
