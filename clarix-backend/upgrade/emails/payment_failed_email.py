from django.core.mail import send_mail
from django.conf import settings


def send_payment_failed_email(user):
    send_mail(
        subject="Payment failed for your Clarix subscription",
        message=f"""
Hi {user.name or user.email},

We couldn't process your payment for Clarix Pro.

Please update your payment method to keep your subscription active:
{settings.FRONTEND_URL}/upgrade

— The Team Clarix
        """,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )
