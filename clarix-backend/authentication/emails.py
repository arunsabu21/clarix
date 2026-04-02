from django.core.mail import send_mail
from django.conf import settings


def send_otp_email(email, otp, name=""):
    subject = "Your Clarix OTP Code"
    message = f""" 
    Hi there,
    Your Clarix OTP Code is: {otp}
    
    This code expires in 5 minutes.
    Do not share this code with anyone.
    
    - Clarix Team
    """

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )
