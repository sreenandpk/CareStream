from django.db import models
from django.core.validators import MinValueValidator
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