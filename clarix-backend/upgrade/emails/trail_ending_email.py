from django.core.mail import send_mail
from django.conf import settings


def send_trial_ending_email(user, days_left):
    send_mail(
        subject=f"Your Clarix trial ends in {days_left} days",
        message=f"""
Hi {user.name or user.email},

Your Clarix Pro free trial ends in {days_left} days.

After that, you'll be charged $12/month automatically.

To cancel before being charged:
{settings.FRONTEND_URL}/upgrade

— The Team Clarix
        """,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )
