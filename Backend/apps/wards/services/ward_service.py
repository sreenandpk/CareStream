from rest_framework.exceptions import (
    NotFound,
    ValidationError,
)
from apps.wards.models import Ward
def get_all_wards():
    return Ward.objects.all().order_by("floor")
def get_ward_by_id(ward_id):
    try:
        return Ward.objects.get(id=ward_id)
    except Ward.DoesNotExist:
        raise NotFound("Ward not found")
def create_ward(data, user):
    name = data.get("name")
    floor = data.get("floor")
    if Ward.objects.filter(
        name=name,
        floor=floor,
    ).exists():
        raise ValidationError(
            "Ward already exists on this floor"
        )
    ward = Ward.objects.create(
        name=name,
        floor=floor,
        description=data.get("description"),
        is_active=data.get("is_active", True),
        created_by=user,
        updated_by=user,
    )
    if "nurses" in data:
        ward.nurses.set(data["nurses"])
    return ward
def update_ward(ward_id, data, user):
    ward = get_ward_by_id(ward_id)
    name = data.get("name", ward.name)
    floor = data.get("floor", ward.floor)
    if Ward.objects.filter(
        name=name,
        floor=floor,
    ).exclude(id=ward.id).exists():
        raise ValidationError(
            "Ward already exists on this floor"
        )
    ward.name = name
    ward.floor = floor
    ward.description = data.get(
        "description",
        ward.description,
    )
    ward.is_active = data.get(
        "is_active",
        ward.is_active,
    )
    ward.updated_by = user
    ward.save()
    if "nurses" in data:
        ward.nurses.set(data["nurses"])
    return ward
def delete_ward(ward_id, user):
    ward = get_ward_by_id(ward_id)
    ward.soft_delete()
    ward.updated_by = user
    ward.save()
    return ward