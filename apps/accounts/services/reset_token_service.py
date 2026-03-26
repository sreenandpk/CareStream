import hashlib
import secrets
from datetime import timedelta
from django.utils import timezone
from apps.accounts.models.reset_token import ResetToken
def create_reset_token(user):
    ResetToken.objects.filter(
        user=user,
        used=False
    ).delete()
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(
        raw_token.encode()
    ).hexdigest()
    ResetToken.objects.create(
        user=user,
        token_hash=token_hash,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    return raw_token