from rest_framework.exceptions import (
    NotFound,
    ValidationError,
)
from apps.devices.models import Device
def get_all_devices():
    return Device.objects.all().order_by(
        "serial_number"
    )
def get_device_by_id(device_id):
    try:
        return Device.objects.get(id=device_id)
    except Device.DoesNotExist:
        raise NotFound("Device not found")
def create_device(data, user):
    serial_number = data.get("serial_number")
    bed = data.get("bed")
    if Device.all_objects.filter(
        serial_number=serial_number,
        is_deleted=False,
    ).exists():
        raise ValidationError(
            "Serial number already exists"
        )
    if bed:
        if Device.all_objects.filter(
            bed=bed,
            is_deleted=False,
        ).exists():
            raise ValidationError(
                "This bed already has a device"
            )
    device = Device.objects.create(
        serial_number=serial_number,
        bed=bed,
        device_type=data.get("device_type"),
        status=data.get("status"),
        firmware_version=data.get(
            "firmware_version"
        ),
        ip_address=data.get(
            "ip_address"
        ),
        last_seen=data.get(
            "last_seen"
        ),
        is_active=data.get(
            "is_active",
            True,
        ),
        created_by=user,
        updated_by=user,
    )
    return device
def update_device(device_id, data, user):
    device = get_device_by_id(device_id)
    new_serial = data.get(
        "serial_number",
        device.serial_number,
    )
    bed = data.get(
        "bed",
        device.bed,
    )
    qs = Device.all_objects.filter(
        serial_number=new_serial,
        is_deleted=False,
    ).exclude(id=device.id)
    if qs.exists():
        raise ValidationError(
            "Serial number already exists"
        )
    if bed:
        qs = Device.all_objects.filter(
            bed=bed,
            is_deleted=False,
        ).exclude(id=device.id)
        if qs.exists():
            raise ValidationError(
                "This bed already has a device"
            )
    device.serial_number = new_serial
    device.bed = bed
    device.device_type = data.get(
        "device_type",
        device.device_type,
    )
    device.status = data.get(
        "status",
        device.status,
    )
    device.firmware_version = data.get(
        "firmware_version",
        device.firmware_version,
    )
    device.ip_address = data.get(
        "ip_address",
        device.ip_address,
    )
    device.last_seen = data.get(
        "last_seen",
        device.last_seen,
    )
    device.is_active = data.get(
        "is_active",
        device.is_active,
    )
    device.updated_by = user
    device.save()
    return device
def delete_device(device_id, user):
    device = get_device_by_id(device_id)
    device.updated_by = user
    device.soft_delete()
    return device