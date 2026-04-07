from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.core.models.base_model import BaseModel
from apps.beds.models import Bed


class Device(BaseModel):

    # -------------------------
    # DEVICE TYPE
    # -------------------------
    class DeviceType(models.TextChoices):
        ICU_MONITOR = "ICU_MONITOR", "ICU Monitor"
        PATIENT_MONITOR = "PATIENT_MONITOR", "Patient Monitor"
        WEARABLE_SENSOR = "WEARABLE_SENSOR", "Wearable Sensor"
        SIMULATOR = "SIMULATOR", "Simulator"

    # -------------------------
    # DEVICE STATUS
    # -------------------------
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        OFFLINE = "OFFLINE", "Offline"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        ERROR = "ERROR", "Error"

    # -------------------------
    # 🔥 DEVICE MODE (REAL vs SIMULATION)
    # -------------------------
    class Mode(models.TextChoices):
        REAL = "REAL", "Real Device"
        SIMULATION = "SIMULATION", "Simulation Device"

    # -------------------------
    # 🔥 SIMULATION MODE (BEHAVIOR)
    # -------------------------
    class SimulationMode(models.TextChoices):
        GLOBAL = "GLOBAL", "Use Global Config"
        NORMAL = "NORMAL", "Normal"
        CRITICAL = "CRITICAL", "Critical"
        RECOVERY = "RECOVERY", "Recovery"

    # -------------------------
    # CORE FIELDS
    # -------------------------
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

    # 🔥 MODE (IMPORTANT)
    mode = models.CharField(
        max_length=20,
        choices=Mode.choices,
        default=Mode.REAL,
        db_index=True,
        help_text="Defines if device is real or simulation",
    )

    # 🔥 SIMULATION CONTROL
    simulation_mode = models.CharField(
        max_length=20,
        choices=SimulationMode.choices,
        default=SimulationMode.GLOBAL,
        db_index=True,
        help_text="Override simulation behavior per device",
    )

    # -------------------------
    # DEVICE META
    # -------------------------
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

    # -------------------------
    # PERFORMANCE OPTIMIZATION
    # -------------------------
    class Meta:
        ordering = ["serial_number"]

        indexes = [
            models.Index(fields=["serial_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["mode"]),              # 🔥 NEW
            models.Index(fields=["simulation_mode"]),
        ]

        verbose_name = "Device"
        verbose_name_plural = "Devices"

    # -------------------------
    # 🔥 VALIDATION
    # -------------------------
    def clean(self):
        if self.mode == self.Mode.SIMULATION and self.device_type != self.DeviceType.SIMULATOR:
            raise ValidationError(
                "Simulation mode requires device type SIMULATOR"
            )

    # -------------------------
    # 🔥 ONLINE STATUS CHECK
    # -------------------------
    def is_online(self):
        if not self.last_seen:
            return False
        return (timezone.now() - self.last_seen).seconds < 60

    # -------------------------
    # STRING
    # -------------------------
    def __str__(self):
        return f"{self.serial_number} - {self.device_type}"