from django.db import models
from django.utils import timezone

from apps.core.models.base_model import BaseModel
from apps.devices.models import Device
from apps.patients.models import Patient
from apps.vitals.models import Vital
from django.contrib.auth import get_user_model

User = get_user_model()


class Alert(BaseModel):

    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ACKNOWLEDGED = "ACKNOWLEDGED", "Acknowledged"
        RESOLVED = "RESOLVED", "Resolved"

    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name="alerts"
    )

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="alerts"
    )

    vital = models.ForeignKey(
        Vital,
        on_delete=models.CASCADE,
        related_name="alerts",
        null=True,       
        blank=True, 
    )

    doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role": "DOCTOR"},
        related_name="alerts"
    )

    alert_type = models.CharField(max_length=100)
    message = models.TextField()

    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.LOW,
        db_index=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )

    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_alerts"
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]

    def acknowledge(self):
        self.status = self.Status.ACKNOWLEDGED
        self.acknowledged_at = timezone.now()
        self.save()

    def resolve(self, user=None):
        self.status = self.Status.RESOLVED
        self.resolved_at = timezone.now()
        self.resolved_by = user
        self.is_active = False
        self.save()

    def __str__(self):
        return f"{self.alert_type} - {self.severity} ({self.status})"