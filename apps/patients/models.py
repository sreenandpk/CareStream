from django.db import models
from apps.beds.models import Bed
class Patient(models.Model):
    bed = models.OneToOneField(
        Bed,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patient"
    )
    name = models.CharField(max_length=150)
    age = models.PositiveIntegerField()
    gender = models.CharField(
        max_length=10,
        choices=[
            ("MALE", "Male"),
            ("FEMALE", "Female"),
            ("OTHER", "Other"),
        ]
    )
    diagnosis = models.TextField(blank=True, null=True)
    admission_date = models.DateTimeField(auto_now_add=True)
    discharge_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def save(self, *args, **kwargs):
        # When assigning patient to bed
        if self.bed:
            self.bed.status = "OCCUPIED"
            self.bed.save()
        super().save(*args, **kwargs)
    def delete(self, *args, **kwargs):
        # When patient removed/discharged
        if self.bed:
            self.bed.status = "AVAILABLE"
            self.bed.save()
        super().delete(*args, **kwargs)
    class Meta:
        ordering = ["-admission_date"]
    def __str__(self):
        return self.name