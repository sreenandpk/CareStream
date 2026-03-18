import secrets
from datetime import timedelta

from django.utils import timezone

from apps.accounts.models.otp_model import OTP
from apps.accounts.services.email_service import send_user_credentials

import logging
def generate_otp(user):

    # delete old OTP
    OTP.objects.filter(
        user=user,
        is_used=False
    ).delete()

    # create code
    code = str(secrets.randbelow(900000) + 100000)

    expires_at = timezone.now() + timedelta(
        minutes=5
    )

    otp = OTP.objects.create(
        user=user,
        code=code,
        expires_at=expires_at,
    )

    # ✅ send email
    if user.email:
        try:
            send_user_credentials(
                email=user.email,
                username=user.username,
                password=code,   # send OTP as password field
            )
        except Exception as e:
            logger = logging.getLogger(__name__)

            logger.error(f"Email error: {e}")

    return otp