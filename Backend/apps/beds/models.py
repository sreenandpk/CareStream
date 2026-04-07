from django.db import models
from apps.core.models.base_model import BaseModel
from apps.rooms.models import Room
class Bed(BaseModel):
    room = models.ForeignKey(
        Room,
        on_delete=models.PROTECT,
        related_name="beds",
    )
    bed_number = models.CharField(
        max_length=10,
        help_text="Bed number inside the room",
    )
    BED_STATUS_CHOICES = [
        ("AVAILABLE", "Available"),
        ("OCCUPIED", "Occupied"),
        ("MAINTENANCE", "Maintenance"),
    ]
    status = models.CharField(
        max_length=20,
        choices=BED_STATUS_CHOICES,
        default="AVAILABLE",
    )
    is_active = models.BooleanField(
        default=True,
    )
    class Meta:
        ordering = ["bed_number"]
        indexes = [
            models.Index(fields=["room"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["room", "bed_number"],
                name="unique_bed_in_room",
            )
        ]
        verbose_name = "Bed"
        verbose_name_plural = "Beds"
    def __str__(self):
        return f"Bed {self.bed_number} - Room {self.room.room_number}"