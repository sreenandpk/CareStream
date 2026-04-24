import secrets
import logging
from datetime import timedelta
from django.utils import timezone
from apps.accounts.models.otp_model import OTP
from apps.accounts.services.email_service import send_auth_otp

def generate_otp(user, otp_type, custom_email=None):
    # Remove old unused codes for this user and type
    OTP.objects.filter(
        user=user,
        otp_type=otp_type,
        is_used=False
    ).delete()
    
    # Generate 6-digit code
    code = str(secrets.randbelow(900000) + 100000)
    expires_at = timezone.now() + timedelta(minutes=5)
    
    otp = OTP.objects.create(
        user=user,
        code=code,
        otp_type=otp_type,
        expires_at=expires_at,
    )
    
    # Send via email
    target_email = custom_email or user.email
    if target_email:
        send_auth_otp(
            email=target_email,
            username=user.username,
            code=code,
            otp_type=otp_type
        )
        
    return otp