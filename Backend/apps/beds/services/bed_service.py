from rest_framework.exceptions import (
    NotFound,
    ValidationError,
)
from apps.beds.models import Bed
def get_all_beds(room_id=None):
    queryset = Bed.objects.all().order_by("bed_number")
    if room_id:
        queryset = queryset.filter(room_id=room_id)
    return queryset
def get_bed_by_id(bed_id):
    try:
        return Bed.objects.get(id=bed_id)
    except Bed.DoesNotExist:
        raise NotFound("Bed not found")
def create_bed(data, user):
    room = data.get("room")
    bed_number = data.get("bed_number")
    if Bed.all_objects.filter(
        room=room,
        bed_number=bed_number,
        is_deleted=False,
    ).exists():
        raise ValidationError(
            "Bed already exists in this room"
        )
    capacity = room.capacity
    existing_beds = room.beds.filter(
        is_deleted=False
    ).count()
    if existing_beds >= capacity:
        raise ValidationError(
            f"Room capacity exceeded. Max allowed: {capacity}"
        )
    bed = Bed.objects.create(
        room=room,
        bed_number=bed_number,
        status=data.get("status"),
        is_active=data.get(
            "is_active",
            True,
        ),
        created_by=user,
        updated_by=user,
    )
    return bed
def update_bed(bed_id, data, user):
    bed = get_bed_by_id(bed_id)
    room = data.get(
        "room",
        bed.room,
    )
    bed_number = data.get(
        "bed_number",
        bed.bed_number,
    )
    if Bed.all_objects.filter(
        room=room,
        bed_number=bed_number,
        is_deleted=False,
    ).exclude(id=bed.id).exists():
        raise ValidationError(
            "Bed already exists in this room"
        )
    capacity = room.capacity
    existing_beds = room.beds.filter(
        is_deleted=False
    ).exclude(id=bed.id).count()
    if existing_beds >= capacity:
        raise ValidationError(
            f"Room capacity exceeded. Max allowed: {capacity}"
        )
    bed.room = room
    bed.bed_number = bed_number
    bed.status = data.get(
        "status",
        bed.status,
    )
    bed.is_active = data.get(
        "is_active",
        bed.is_active,
    )
    bed.updated_by = user
    bed.save()
    return bed
def delete_bed(bed_id, user):
    bed = get_bed_by_id(bed_id)
    bed.updated_by = user
    bed.soft_delete()
    return bed