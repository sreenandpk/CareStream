from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.patients.models import Patient
from apps.devices.models import Device
class Vital(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="vitals"
    )
    device = models.ForeignKey(
        Device,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vitals"
    )
    heart_rate = models.IntegerField(
        validators=[MinValueValidator(30), MaxValueValidator(220)],
        help_text="Heart rate in beats per minute"
    )
    spo2 = models.IntegerField(
        validators=[MinValueValidator(50), MaxValueValidator(100)],
        help_text="Oxygen saturation percentage"
    )
    respiratory_rate = models.IntegerField(
        validators=[MinValueValidator(5), MaxValueValidator(60)],
        help_text="Breaths per minute"
    )
    temperature = models.FloatField(
        validators=[MinValueValidator(30), MaxValueValidator(45)],
        help_text="Body temperature in Celsius"
    )
    systolic_bp = models.IntegerField(
        validators=[MinValueValidator(50), MaxValueValidator(250)]
    )
    diastolic_bp = models.IntegerField(
        validators=[MinValueValidator(30), MaxValueValidator(150)]
    )
    recorded_at = models.DateTimeField(
        auto_now_add=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["patient"]),
            models.Index(fields=["device"]),
            models.Index(fields=["recorded_at"]),
            models.Index(fields=["patient", "recorded_at"]),
        ]
    def __str__(self):
        return f"{self.patient.name} vitals at {self.recorded_at}"