from django.core.mail import send_mail
from django.conf import settings


def send_subscription_activated_email(user, plan):
    send_mail(
        subject="Welcome to Clarix Pro",
        message=f"""
        Hi {user.name or user.email},
        
        Your Clarix {plan.capitalize()} subscription is now active!
        
        You now have access to:
        - Unlimited AI messages
        - Gemini 2.0 Flash + Groq Llama
        - Image uploads & vision
        - Priority response speed
        
        your 7-day free trail has started. You won't be charged until it ends.
        
        Start chatting: {settings.FRONTEND_URL}/chat
        
        - The Team Clarix
        """,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )
