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
        validators=[MinValueValidator(0), MaxValueValidator(220)],
        help_text="Heart rate (bpm)",
        null=True,
        blank=True,
    )

    spo2 = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Oxygen saturation (%)",
        null=True,
        blank=True,
    )


    temperature = models.FloatField(
        validators=[MinValueValidator(30), MaxValueValidator(45)],
        help_text="Body temperature (C)",
        null=True,
        blank=True,
    )

    systolic_bp = models.IntegerField(
        validators=[MinValueValidator(50), MaxValueValidator(250)],
        null=True,
        blank=True,
    )

    diastolic_bp = models.IntegerField(
        validators=[MinValueValidator(30), MaxValueValidator(150)],
        null=True,
        blank=True,
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


class VitalArchive(BaseModel):
    """
    🏥 WARM DATA LAYER (1 Minute Resolution)
    Stores aggregated clinical trends for the last 24 hours.
    """
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="archives")
    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Aggregated Vitals
    hr_min = models.IntegerField()
    hr_max = models.IntegerField()
    hr_avg = models.FloatField()
    
    spo2_min = models.IntegerField()
    spo2_max = models.IntegerField()
    spo2_avg = models.FloatField()
    
    temp_avg = models.FloatField()
    
    # Blood Pressure (Avg for trends)
    systolic_avg = models.FloatField()
    diastolic_avg = models.FloatField()
    
    data_type = models.CharField(max_length=20, default="REAL")
    recorded_at = models.DateTimeField(db_index=True)

    class Meta:
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["device", "recorded_at"]),
            models.Index(fields=["data_type"]),
        ]


class VitalSummary(BaseModel):
    """
    ❄️ COLD DATA LAYER (1 Hour Resolution)
    Stores long-term clinical audit footprints for 30 days.
    """
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="summaries")
    
    # Hour-level stats
    hr_min = models.IntegerField()
    hr_max = models.IntegerField()
    hr_avg = models.FloatField()
    
    spo2_min = models.IntegerField()
    spo2_max = models.IntegerField()
    spo2_avg = models.FloatField()
    
    data_type = models.CharField(max_length=20, default="REAL")
    recorded_at = models.DateTimeField(db_index=True)

    class Meta:
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["device", "recorded_at"]),
        ]


class ClinicalReviewLog(BaseModel):
    """
    📜 AUDIT LOG: Tracks clinical telemetry review sessions.
    Required for clinical accountability and forensic traceability.
    """
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name="review_logs")
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="review_logs")
    accessed_at = models.DateTimeField(auto_now_add=True)
    window_start = models.DateTimeField()
    window_end = models.DateTimeField()

    class Meta:
        ordering = ["-accessed_at"]
        verbose_name = "Clinical Review Log"
        verbose_name_plural = "Clinical Review Logs"

    def __str__(self):
        return f"{self.user.username} (Nurse) reviewed {self.device.serial_number} at {self.accessed_at}"