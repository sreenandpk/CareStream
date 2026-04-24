from rest_framework.exceptions import (
    NotFound,
    ValidationError,
)
from apps.rooms.models import Room
def get_all_rooms(ward_id=None):
    queryset = Room.objects.all().order_by("room_number")
    if ward_id:
        queryset = queryset.filter(ward_id=ward_id)
    return queryset
def get_room_by_id(room_id):
    try:
        return Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        raise NotFound("Room not found")
def create_room(data, user):
    ward = data.get("ward")
    room_number = data.get("room_number")
    if Room.all_objects.filter(
        ward=ward,
        room_number=room_number,
        is_deleted=False,
    ).exists():
        raise ValidationError(
            "Room already exists in this ward"
        )
    room = Room.objects.create(
        ward=ward,
        room_number=room_number,
        room_type=data.get("room_type"),
        capacity=data.get("capacity"),
        is_active=data.get(
            "is_active",
            True,
        ),
        created_by=user,
        updated_by=user,
    )
    return room
def update_room(room_id, data, user):
    room = get_room_by_id(room_id)
    ward = data.get(
        "ward",
        room.ward,
    )
    room_number = data.get(
        "room_number",
        room.room_number,
    )
    if Room.all_objects.filter(
        ward=ward,
        room_number=room_number,
        is_deleted=False,
    ).exclude(id=room.id).exists():
        raise ValidationError(
            "Room already exists in this ward"
        )
    room.ward = ward
    room.room_number = room_number
    room.room_type = data.get(
        "room_type",
        room.room_type,
    )
    room.capacity = data.get(
        "capacity",
        room.capacity,
    )
    room.is_active = data.get(
        "is_active",
        room.is_active,
    )
    room.updated_by = user
    room.save()
    return room
def delete_room(room_id, user):
    room = get_room_by_id(room_id)
    room.updated_by = user
    room.soft_delete()
    return room