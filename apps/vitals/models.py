from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models.base_model import BaseModel
from apps.devices.models import Device
from apps.patients.models import Patient


class Vital(BaseModel):

    # -------------------------
    # SOURCE TYPE (IMPORTANT 🔥)
    # -------------------------
    class Source(models.TextChoices):
        DEVICE = "DEVICE", "Real Device"
        SIMULATION = "SIMULATION", "Simulation Engine"

    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        db_index=True,
        help_text="Source of vitals data",
        default=Source.DEVICE,
    )

    # -------------------------
    # RELATIONS
    # -------------------------
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name="vitals",
    )

    patient = models.ForeignKey(
        Patient,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vitals",
    )

    # -------------------------
    # VITALS DATA
    # -------------------------
    heart_rate = models.IntegerField(
        validators=[MinValueValidator(30), MaxValueValidator(220)],
        help_text="Heart rate (bpm)",
    )

    spo2 = models.IntegerField(
        validators=[MinValueValidator(50), MaxValueValidator(100)],
        help_text="Oxygen saturation (%)",
    )

    respiratory_rate = models.IntegerField(
        validators=[MinValueValidator(5), MaxValueValidator(60)],
        help_text="Breaths per minute",
    )

    temperature = models.FloatField(
        validators=[MinValueValidator(30), MaxValueValidator(45)],
        help_text="Body temperature (C)",
    )

    systolic_bp = models.IntegerField(
        validators=[MinValueValidator(50), MaxValueValidator(250)],
    )

    diastolic_bp = models.IntegerField(
        validators=[MinValueValidator(30), MaxValueValidator(150)],
    )

    # -------------------------
    # TIMESTAMP
    # -------------------------
    recorded_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    # -------------------------
    # META
    # -------------------------
    class Meta:
        ordering = ["-recorded_at"]

        indexes = [
            models.Index(fields=["device"]),
            models.Index(fields=["patient"]),
            models.Index(fields=["source"]),  # 🔥 NEW
            models.Index(fields=["recorded_at"]),
            models.Index(fields=["device", "recorded_at"]),
            models.Index(fields=["patient", "recorded_at"]),  # 🔥 NEW
        ]

        verbose_name = "Vital"
        verbose_name_plural = "Vitals"

    # -------------------------
    # STRING
    # -------------------------
    def __str__(self):
        if self.device:
            return f"{self.device.serial_number} vitals at {self.recorded_at}"
        if self.patient:
            return f"{self.patient.name} vitals at {self.recorded_at}"
        return f"Vitals at {self.recorded_at}"