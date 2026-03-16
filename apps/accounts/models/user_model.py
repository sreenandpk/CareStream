from django.contrib.auth.models import AbstractUser
from django.db import models
class User(AbstractUser):
    ROLE_CHOICES = [
        ("SYSTEM_ADMIN", "System Admin"),
        ("ADMIN", "Admin"),
        ("DOCTOR", "Doctor"),
        ("NURSE", "Nurse"),
    ]
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="ADMIN",
    )
    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="OTP verification status",
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )
    class Meta:
        ordering = ["id"]
    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = "SYSTEM_ADMIN"
        super().save(*args, **kwargs)
    def __str__(self):
        return self.username