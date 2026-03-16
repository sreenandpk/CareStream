from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()
class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("VIEW", "View"),
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
        ("LOGIN", "Login"),
        ("LOGOUT", "Logout"),
    ]
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES
    )
    model_name = models.CharField(
        max_length=100
    )
    object_id = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )
    timestamp = models.DateTimeField(
        auto_now_add=True
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True
    )
    description = models.TextField(
        blank=True,
        null=True
    )
    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["model_name"]),
            models.Index(fields=["timestamp"]),
        ]
    def __str__(self):
        return f"{self.user} {self.action} {self.model_name}"