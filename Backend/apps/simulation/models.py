from django.db import models
from apps.core.models.base_model import BaseModel


class SimulationConfig(BaseModel):

    # -------------------------
    # MODE (SCENARIO TYPE)
    # -------------------------
    class Mode(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        CRITICAL = "CRITICAL", "Critical"
        RECOVERY = "RECOVERY", "Recovery"

    mode = models.CharField(
        max_length=20,
        choices=Mode.choices,
        default=Mode.NORMAL,
        db_index=True,
    )

    # -------------------------
    # 🔥 TREND (IMPORTANT)
    # -------------------------
    class Trend(models.TextChoices):
        STABLE = "STABLE", "Stable"
        WORSENING = "WORSENING", "Worsening"
        IMPROVING = "IMPROVING", "Improving"

    trend = models.CharField(
        max_length=20,
        choices=Trend.choices,
        default=Trend.STABLE,
        db_index=True,
    )

    # -------------------------
    # 🔥 VITAL RANGES (REALISTIC)
    # -------------------------
    heart_rate_min = models.IntegerField(default=60)
    heart_rate_max = models.IntegerField(default=100)

    spo2_min = models.IntegerField(default=95)
    spo2_max = models.IntegerField(default=100)

    systolic_bp_min = models.IntegerField(default=110)
    systolic_bp_max = models.IntegerField(default=130)

    diastolic_bp_min = models.IntegerField(default=70)
    diastolic_bp_max = models.IntegerField(default=90)


    temperature_min = models.FloatField(default=36.5)
    temperature_max = models.FloatField(default=37.5)

    # -------------------------
    # 🔥 CONTROL
    # -------------------------
    variability = models.FloatField(
        default=0.05,
        help_text="Random noise factor (e.g. 0.05 = 5% noise)",
    )

    auto_reset = models.BooleanField(default=True)

    reset_interval = models.IntegerField(
        default=300,
        help_text="Seconds before resetting simulation state",
    )

    is_active = models.BooleanField(default=True)

    # -------------------------
    # 🔥 TARGET DEVICE
    # -------------------------
    device = models.OneToOneField(
        "devices.Device",
        on_delete=models.CASCADE,
        related_name="simulation_config",
        null=True,
        blank=True,
        help_text="The hardware unit this configuration applies to",
    )

    # -------------------------
    # META
    # -------------------------
    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[Simulation] Mode={self.mode} Trend={self.trend}"