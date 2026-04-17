from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
class OTP(models.Model):
    TYPE_CHOICES = [
        ("LOGIN", "Login"),
        ("RESET", "Reset Password"),
        ("EMAIL_CHANGE", "Email Change Verification"),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="otps",
        db_index=True,
    )
    code = models.CharField(
        max_length=6,
        db_index=True,
    )
    otp_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
    )
    is_used = models.BooleanField(
        default=False
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    expires_at = models.DateTimeField()
    def is_expired(self):
        return timezone.now() > self.expires_at
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=5)
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.user} - {self.code}"