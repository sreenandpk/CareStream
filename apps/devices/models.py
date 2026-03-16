from django.db import models
from apps.beds.models import Bed
class Device(models.Model):
    DEVICE_TYPE_CHOICES = [
        ("ICU_MONITOR", "ICU Monitor"),
        ("PORTABLE_MONITOR", "Portable Monitor"),
        ("WEARABLE_SENSOR", "Wearable Sensor"),
    ]
    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("OFFLINE", "Offline"),
        ("MAINTENANCE", "Maintenance"),
    ]
    device_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique device identifier"
    )
    bed = models.OneToOneField(
        Bed,
        on_delete=models.CASCADE,
        related_name="device",
        help_text="Device assigned to a specific bed"
    )
    device_type = models.CharField(
        max_length=30,
        choices=DEVICE_TYPE_CHOICES,
        default="ICU_MONITOR"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ACTIVE"
    )
    last_seen = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time the device sent data"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["device_id"]
        indexes = [
            models.Index(fields=["device_id"]),
            models.Index(fields=["status"]),
        ]
    def __str__(self):
        return f"{self.device_id} ({self.device_type})"