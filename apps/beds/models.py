from django.db import models
from django.core.validators import MinValueValidator
from apps.rooms.models import Room
class Bed(models.Model):
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="beds"
    )
    bed_number = models.CharField(
        max_length=10,
        help_text="Bed number inside the room"
    )
    BED_STATUS_CHOICES = [
        ("AVAILABLE", "Available"),
        ("OCCUPIED", "Occupied"),
        ("MAINTENANCE", "Maintenance"),
    ]
    status = models.CharField(
        max_length=20,
        choices=BED_STATUS_CHOICES,
        default="AVAILABLE"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["bed_number"]
        indexes = [
            models.Index(fields=["bed_number"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["room", "bed_number"],
                name="unique_bed_in_room"
            )
        ]
    def __str__(self):
        return f"Bed {self.bed_number} - Room {self.room.room_number}"