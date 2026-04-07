import secrets
from datetime import timedelta
from django.utils import timezone
from apps.accounts.models.otp_model import OTP
from apps.accounts.services.email_service import send_user_credentials
import logging
def generate_otp(user, otp_type):
    OTP.objects.filter(
        user=user,
        otp_type=otp_type,
        is_used=False
    ).delete()
    code = str(secrets.randbelow(900000) + 100000)
    expires_at = timezone.now() + timedelta(
        minutes=5
    )
    otp = OTP.objects.create(
        user=user,
        code=code,
        otp_type=otp_type,
        expires_at=expires_at,
    )
    if user.email:
        try:
            send_user_credentials(
                email=user.email,
                username=user.username,
                password=code,
            )
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Email error: {e}")
    return otp