from django.db import models
from django.core.validators import MinValueValidator
from apps.core.models.base_model import BaseModel
from apps.wards.models import Ward
class Room(BaseModel):
    ward = models.ForeignKey(
        Ward,
        on_delete=models.PROTECT,
        related_name="rooms",
    )
    room_number = models.CharField(
        max_length=20,
        help_text="Room number inside the ward",
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
        default="SHARED",
    )
    capacity = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Maximum number of beds in this room",
    )
    is_active = models.BooleanField(
        default=True,
    )
    class Meta:
        ordering = ["room_number"]
        indexes = [
            models.Index(fields=["room_number"]),
            models.Index(fields=["ward"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["ward", "room_number"],
                name="unique_room_in_ward",
            )
        ]
        verbose_name = "Room"
        verbose_name_plural = "Rooms"
    def __str__(self):
        return f"{self.room_number} - {self.ward.name}"