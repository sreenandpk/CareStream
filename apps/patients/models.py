from django.db import models

from apps.core.models.base_model import BaseModel
from apps.beds.models import Bed


class Patient(BaseModel):

    bed = models.OneToOneField(
        Bed,
        on_delete=models.PROTECT,
        related_name="patient",
    )

    name = models.CharField(
        max_length=150
    )

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

    admission_date = models.DateTimeField(
        auto_now_add=True
    )

    discharge_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True
    )

    class Meta:
        ordering = ["-admission_date"]

    # ✅ SAFE SAVE
    def save(self, *args, **kwargs):

        old_bed = None

        if self.pk:
            try:
                old = Patient.objects.get(pk=self.pk)
                old_bed = old.bed
            except Patient.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        # mark new bed occupied
        if self.bed_id:
            self.bed.status = "OCCUPIED"
            self.bed.save()

        # free old bed
        if old_bed and old_bed != self.bed:
            old_bed.status = "AVAILABLE"
            old_bed.save()

    # ✅ SAFE SOFT DELETE
    def soft_delete(self):

        if self.bed_id:
            self.bed.status = "AVAILABLE"
            self.bed.save()

        super().soft_delete()

    def __str__(self):
        return self.name