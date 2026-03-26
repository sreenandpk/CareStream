from django.db import models

from apps.core.models.base_model import BaseModel
from apps.beds.models import Bed


class Device(BaseModel):

    class DeviceType(models.TextChoices):
        ICU_MONITOR = "ICU_MONITOR", "ICU Monitor"
        PATIENT_MONITOR = "PATIENT_MONITOR", "Patient Monitor"
        WEARABLE_SENSOR = "WEARABLE_SENSOR", "Wearable Sensor"
        SIMULATOR = "SIMULATOR", "Simulator"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        OFFLINE = "OFFLINE", "Offline"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        ERROR = "ERROR", "Error"

    serial_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Unique device serial number",
    )

    bed = models.OneToOneField(
        Bed,
        on_delete=models.PROTECT,
        related_name="device",
        help_text="Device assigned to bed",
    )

    device_type = models.CharField(
        max_length=30,
        choices=DeviceType.choices,
        default=DeviceType.PATIENT_MONITOR,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )

    firmware_version = models.CharField(
        max_length=50,
        blank=True,
        null=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    last_seen = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last heartbeat from device",
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:

        ordering = ["serial_number"]

        indexes = [
            models.Index(fields=["serial_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["is_active"]),
        ]

        verbose_name = "Device"
        verbose_name_plural = "Devices"

    def __str__(self):
        return f"{self.serial_number} - {self.device_type}"