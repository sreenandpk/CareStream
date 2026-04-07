from django.core.mail import send_mail
from django.conf import settings
import logging
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
        logger = logging.getLogger(__name__)
        logger.error(f"Email error: {e}")