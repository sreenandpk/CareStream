from django.db import models
from django.core.validators import MinValueValidator
from apps.wards.models import Ward
class Room(models.Model):
    ward = models.ForeignKey(
        Ward,
        on_delete=models.CASCADE,
        related_name="rooms"
    )
    room_number = models.CharField(
        max_length=20,
        help_text="Room number inside the ward"
    )
    ROOM_TYPE_CHOICES = [
        ("PRIVATE", "Private Room"),
        ("SHARED", "Shared Room"),
        ("ISOLATION", "Isolation Room"),
        ("OBSERVATION", "Observation Room"),
    ]
    room_type = models.CharField(
        max_length=20,
        choices=ROOM_TYPE_CHOICES,
        default="SHARED"
    )
    capacity = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Maximum number of beds in this room"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["room_number"]
        indexes = [
            models.Index(fields=["room_number"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["ward", "room_number"],
                name="unique_room_in_ward"
            )
        ]
    def __str__(self):
        return f"{self.room_number} - {self.ward.name}"