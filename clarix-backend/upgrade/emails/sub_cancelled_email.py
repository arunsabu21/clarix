from django.core.mail import send_mail
from django.conf import settings


def send_subscription_cancelled_email(user):
    send_mail(
        subject="Your Clarix subscription has been cancelled",
        message=f"""
Hi {user.name or user.email},

Your Clarix Pro subscription has been cancelled.

You'll keep access until the end of your billing period.
After that, your account will be downgraded to the free plan.

You can resubscribe anytime at:
{settings.FRONTEND_URL}/upgrade

— The Team Clarix
        """,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )
