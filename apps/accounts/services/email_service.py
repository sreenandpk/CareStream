from django.core.mail import send_mail
from django.conf import settings


def send_user_credentials(email, username, password):

    subject = "CareStream Account Created"

    message = f"""
Your CareStream account / OTP

Username: {username}
OTP / Password: {password}
"""

    try:
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
    except Exception as e:
        print("Email error:", e)