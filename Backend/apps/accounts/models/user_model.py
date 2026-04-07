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
        db_index=True,
    )

    email = models.EmailField(unique=True)

    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        db_index=True,
    )

    # 🔥 ADD THIS (ONLY NEW THINGS YOU NEED)
    specialization = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    license_number = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    # 🔐 EXISTING (KEEP SAME)
    is_verified = models.BooleanField(
        default=False,
        help_text="OTP verification status",
    )

    force_password_reset = models.BooleanField(
        default=False,
        help_text="User must reset password"
    )

    failed_login_attempts = models.IntegerField(
        default=0
    )

    is_locked = models.BooleanField(
        default=False
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
            self.is_staff = True
            self.is_verified = True
            self.role = "SYSTEM_ADMIN"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"