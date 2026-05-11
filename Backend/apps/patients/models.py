from django.db import models
from apps.core.models.base_model import BaseModel
from apps.beds.models import Bed
from django.conf import settings


class Patient(BaseModel):

    bed = models.OneToOneField(
        Bed,
        on_delete=models.PROTECT,
        related_name="patient",
    )

    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role": "DOCTOR"},
        related_name="patients"
    )

    primary_nurse = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"role": "NURSE"},
        related_name="primary_patients"
    )

    name = models.CharField(max_length=150)
    age = models.PositiveIntegerField()

    GENDER_CHOICES = [
        ("MALE", "Male"),
        ("FEMALE", "Female"),
        ("OTHER", "Other"),
    ]

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
    )

    diagnosis = models.TextField(
        blank=True,
        null=True,
    )

    # -------------------------
    # 🔥 DEPRECATED: MODE (ICU Architecture Overhaul)
    # Use Device.mode as primary gate.
    # -------------------------
    MODE_CHOICES = [
        ("SIMULATION", "Simulation"),
        ("REAL", "Real Device"),
    ]

    mode = models.CharField(
        max_length=20,
        choices=MODE_CHOICES,
        default="SIMULATION",
        help_text="DEPRECATED: System now respects Device.mode as the single source of truth.",
    )

    admission_date = models.DateTimeField(auto_now_add=True)

    discharge_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    CLINICAL_CONDITION_CHOICES = [
        ("STABLE", "Stable"),
        ("CRITICAL", "Critical"),
    ]

    clinical_condition = models.CharField(
        max_length=20,
        choices=CLINICAL_CONDITION_CHOICES,
        default="STABLE",
        help_text="Authoritative clinical status set by a physician."
    )

    last_condition_update_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="condition_updates"
    )
    last_condition_update_at = models.DateTimeField(null=True, blank=True)
    
    # 🧠 AI REFINED CONTEXT (ML Backbone Integration)
    ai_condition_summary = models.TextField(
        blank=True, 
        null=True, 
        help_text="ML-generated clinical summary based on telemetry trends."
    )
    last_ai_assessment = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Timestamp of the latest Scikit-Learn assessment."
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-admission_date"]

    def save(self, *args, **kwargs):

        old_bed = None

        if self.pk:
            try:
                old = Patient.objects.get(pk=self.pk)
                old_bed = old.bed
            except Patient.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        if self.bed_id:
            self.bed.status = "OCCUPIED"
            self.bed.save()

        if old_bed and old_bed != self.bed:
            old_bed.status = "AVAILABLE"
            old_bed.save()

    def soft_delete(self):

        if self.bed_id:
            self.bed.status = "AVAILABLE"
            self.bed.save()

        super().soft_delete()

    def __str__(self):
        return self.name


class ClinicalNote(BaseModel):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="clinical_notes"
    )
    nurse = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="authored_notes"
    )
    content = models.TextField()

    class Meta:
        ordering = ["-created_at"]


class MedicationOrder(BaseModel):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="medication_orders"
    )
    prescribed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "DOCTOR"},
        related_name="prescriptions"
    )
    medication_name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    route = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]


class MedicationAdministration(BaseModel):
    order = models.ForeignKey(
        MedicationOrder,
        on_delete=models.CASCADE,
        related_name="administrations"
    )
    nurse = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medication_logs"
    )
    administered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default="COMPLETED")
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-administered_at"]