import secrets
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models.functions import Lower

from apps.core.models.base_model import BaseModel
from apps.beds.models import Bed


def generate_api_key():
    return secrets.token_urlsafe(32)


class Device(BaseModel):

    # -------------------------
    # DEVICE TYPE
    # -------------------------
    class DeviceType(models.TextChoices):
        ICU_MONITOR = "ICU_MONITOR", "ICU Monitor"
        PATIENT_MONITOR = "PATIENT_MONITOR", "Patient Monitor"
        WEARABLE_SENSOR = "WEARABLE_SENSOR", "Wearable Sensor"

    # -------------------------
    # DEVICE STATUS
    # -------------------------
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        OFFLINE = "OFFLINE", "Offline"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        ERROR = "ERROR", "Error"

    # -------------------------
    # DEVICE MODE
    # -------------------------
    class Mode(models.TextChoices):
        REAL = "REAL", "Real Device"
        SIMULATION = "SIMULATION", "Simulation Device"

    # -------------------------
    # SIMULATION MODE
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
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="device",
        help_text="Device assigned to bed (Optional)",
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

    mode = models.CharField(
        max_length=20,
        choices=Mode.choices,
        default=Mode.REAL,
        db_index=True,
    )

    simulation_mode = models.CharField(
        max_length=20,
        choices=SimulationMode.choices,
        default=SimulationMode.GLOBAL,
        db_index=True,
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

    last_simulated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last simulation run time",
    )

    is_active = models.BooleanField(
        default=True,
    )
    
    api_key = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        default=generate_api_key,
        help_text="Current active key for hardware authentication",
    )

    previous_api_key = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Fallback key used during rotation grace period",
    )

    key_created_at = models.DateTimeField(
        default=timezone.now,
        help_text="Timestamp when the current API key was generated",
    )

    key_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Optional expiration for the current key",
    )

    is_key_revoked = models.BooleanField(
        default=False,
        help_text="Hard block on all authentication for this device",
    )

    monitor_label = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Clinician-friendly name (e.g. ICU-MONITOR-01)",
    )

    # -------------------------
    # SIMULATION MEMORY
    # -------------------------
    last_hr = models.FloatField(null=True, blank=True)
    last_spo2 = models.FloatField(null=True, blank=True)
    last_temp = models.FloatField(null=True, blank=True)
    last_rr = models.FloatField(null=True, blank=True)
    last_sys = models.FloatField(null=True, blank=True)
    last_dia = models.FloatField(null=True, blank=True)

    # -------------------------
    # PROPERTIES
    # -------------------------
    @property
    def is_simulation(self):
        return self.mode == self.Mode.SIMULATION

    @property
    def is_assigned(self):
        return self.bed is not None

    @property
    def has_patient(self):
        return self.bed is not None and getattr(self.bed, "patient", None) is not None

    @property
    def can_simulate(self):
        return (
            self.mode == self.Mode.SIMULATION
            and self.is_active
            and self.is_assigned
            and not self.is_key_revoked
        )

    @property
    def device_state(self):
        """
        Determines the connectivity state based on last seen heartbeat
        """
        if not self.last_seen and not self.last_simulated_at:
            return "OFFLINE"
        
        # Use either hardware heartbeat or simulation heartbeat
        last_activity = self.last_seen
        if self.is_simulation:
            last_activity = self.last_simulated_at

        if not last_activity:
            return "OFFLINE"

        delta = (timezone.now() - last_activity).total_seconds()
        
        if delta < 10:
            return "LIVE"
        if delta < 30:
            return "DELAYED"
        return "OFFLINE"

    # -------------------------
    # META
    # -------------------------
    class Meta:
        ordering = ["serial_number"]

        indexes = [
            models.Index(fields=["serial_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["mode"]),
            models.Index(fields=["simulation_mode"]),
            models.Index(fields=["last_simulated_at"]),
        ]

        constraints = [
            models.UniqueConstraint(
                Lower("serial_number"),
                name="unique_serial_number_case_insensitive"
            )
        ]

        verbose_name = "Device"
        verbose_name_plural = "Devices"

    # -------------------------
    # VALIDATION
    # -------------------------
    def clean(self):
        if self.mode == self.Mode.REAL and self.simulation_mode != self.SimulationMode.GLOBAL:
            raise ValidationError(
                "Real devices must use GLOBAL simulation mode"
            )

        if self.mode == self.Mode.SIMULATION and self.simulation_mode == self.SimulationMode.GLOBAL:
            raise ValidationError(
                "Simulation devices must have a specific simulation mode"
            )

    # -------------------------
    # AUTO VALIDATION & KEY GEN
    # -------------------------
    def save(self, *args, **kwargs):
        if not self.api_key:
            self.api_key = generate_api_key()
            self.key_created_at = timezone.now()
        self.full_clean()
        super().save(*args, **kwargs)

    # -------------------------
    # KEY LIFECYCLE
    # -------------------------
    def rotate_api_key(self):
        """
        Rotates the active key to previous_api_key and generates a new one.
        Restores the device status to ACTIVE if it was previously in ERROR.
        """
        self.previous_api_key = self.api_key
        self.api_key = generate_api_key()
        self.key_created_at = timezone.now()
        self.is_key_revoked = False
        self.status = self.Status.ACTIVE
        self.save()

    def revoke_all_keys(self):
        """
        Invalidates both current and previous keys and marks the device as in error state.
        """
        self.is_key_revoked = True
        self.status = self.Status.ERROR
        self.save()

    def is_grace_period_valid(self):
        """
        Returns True if the previous key is still within the 5-minute grace period.
        """
        if not self.previous_api_key or not self.key_created_at:
            return False
        
        # Grace period is 5 minutes after the NEW key was created
        delta = (timezone.now() - self.key_created_at).total_seconds()
        return delta < 300  # 5 minutes

    # -------------------------
    # ONLINE STATUS
    # -------------------------
    def is_online(self):
        if not self.last_seen:
            return False
        return (timezone.now() - self.last_seen).total_seconds() < 180

    # -------------------------
    # STRING
    # -------------------------
    def __str__(self):
        return f"{self.serial_number} ({self.mode})"