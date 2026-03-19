from django.db import models
from django.conf import settings


class UserSession(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions",
    )

    token = models.CharField(
        max_length=255,
        db_index=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    user_agent = models.TextField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True
    )

    login_time = models.DateTimeField(
        auto_now_add=True
    )

    logout_time = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-login_time"]

    def __str__(self):
        return f"{self.user} - {self.ip_address}"