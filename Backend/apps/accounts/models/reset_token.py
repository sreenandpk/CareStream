import hashlib
import secrets
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
class ResetToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reset_tokens",
    )
    token_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    def is_expired(self):
        return timezone.now() > self.expires_at