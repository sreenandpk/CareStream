from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
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

    GENDER_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    ]
    gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
        default="M",
    )

    active_connections = models.PositiveIntegerField(default=0)

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

    # 📧 Professional Email Tracking
    EMAIL_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("valid", "Valid"),
        ("invalid", "Invalid"),
    ]
    email_status = models.CharField(
        max_length=10,
        choices=EMAIL_STATUS_CHOICES,
        default="pending",
        db_index=True,
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
            self.role = "ADMIN"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"