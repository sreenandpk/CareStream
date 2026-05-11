from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from apps.core.models.base_model import BaseModel
class Ward(BaseModel):
    name = models.CharField(
        max_length=100,
        unique=True
    )
    floor = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="Floor number where the ward is located"
    )
    description = models.TextField(
        blank=True,
        null=True
    )
    is_active = models.BooleanField(
        default=True
    )

    nurses = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="assigned_wards",
        blank=True,
        limit_choices_to={"role": "NURSE"}
    )
    class Meta:
        ordering = ["floor"]
        indexes = [
            models.Index(fields=["floor"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "floor"],
                name="unique_ward_floor"
            )
        ]
        verbose_name = "Ward"
        verbose_name_plural = "Wards"
    def __str__(self):
        return f"{self.name} (Floor {self.floor})"


class NurseShift(BaseModel):
    SHIFT_CHOICES = [
        ("DAY", "Day Shift"),
        ("NIGHT", "Night Shift"),
    ]

    nurse = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shifts",
        limit_choices_to={"role": "NURSE"}
    )
    ward = models.ForeignKey(
        Ward,
        on_delete=models.CASCADE,
        related_name="shifts"
    )
    shift_type = models.CharField(
        max_length=10,
        choices=SHIFT_CHOICES
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this shift is currently receiving telemetry"
    )

    class Meta:
        ordering = ["-start_time"]
        verbose_name = "Nurse Shift"
        verbose_name_plural = "Nurse Shifts"

    def __str__(self):
        return f"{self.nurse.username} at {self.ward.name} ({self.shift_type})"