from rest_framework.exceptions import NotFound, ValidationError

import logging
import json
from django.db import transaction, models
from django.db.models.functions import Lower
from django.utils import timezone

from apps.devices.models import Device
from apps.simulation.models import SimulationConfig
from apps.alerts.models import Alert
logger = logging.getLogger("device")
audit_logger = logging.getLogger("audit")
def get_all_devices(filters: dict = None):
    queryset = Device.objects.all().order_by("serial_number")
    if filters:
        ward_id = filters.get("ward_id")
        room_id = filters.get("room_id")
        bed_id = filters.get("bed_id")
        status = filters.get("status")
        mode = filters.get("mode")
        is_active = filters.get("is_active")
        search = filters.get("search")

        if ward_id:
            queryset = queryset.filter(bed__room__ward_id=ward_id)
        if room_id:
            queryset = queryset.filter(bed__room_id=room_id)
        if bed_id:
            queryset = queryset.filter(bed_id=bed_id)
        if status:
            queryset = queryset.filter(status=status)
        if mode:
            queryset = queryset.filter(mode=mode)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        if search:
            queryset = queryset.filter(
                models.Q(serial_number__icontains=search) | 
                models.Q(monitor_label__icontains=search)
            )

    return queryset


# 🔷 GET BY ID
def get_device_by_id(device_id):
    try:
        return Device.objects.get(id=device_id)
    except Device.DoesNotExist:
        raise NotFound("Device not found")


# 🔷 CREATE
@transaction.atomic
def create_device(data, user):

    serial_number = data.get("serial_number")
    bed = data.get("bed")

    if not serial_number:
        raise ValidationError("Serial number is required")

    # 🔥 CASE-INSENSITIVE CHECK
    if Device.all_objects.filter(
        serial_number__iexact=serial_number,
        is_deleted=False,
    ).exists():
        raise ValidationError("Serial number already exists")

    if bed:
        if Device.all_objects.filter(
            bed=bed,
            is_deleted=False,
        ).exists():
            raise ValidationError("This bed already has a device")

    mode = data.get("mode", "REAL")
    simulation_mode = data.get("simulation_mode", "GLOBAL")

    VALID_SIM_MODES = ["NORMAL", "CRITICAL", "RECOVERY", "GLOBAL"]

    if simulation_mode not in VALID_SIM_MODES:
        raise ValidationError("Invalid simulation mode")

    # 🔥 STRICT MODE VALIDATION
    if mode == "REAL" and simulation_mode != "GLOBAL":
        raise ValidationError("Real devices must use GLOBAL simulation mode")

    if mode == "SIMULATION" and simulation_mode == "GLOBAL":
        raise ValidationError("Simulation devices must define behavior")

    device = Device.objects.create(
        serial_number=serial_number,
        bed=bed,
        device_type=data.get("device_type"),
        status=data.get("status"),
        mode=mode,
        simulation_mode=simulation_mode,
        firmware_version=data.get("firmware_version"),
        ip_address=data.get("ip_address"),
        last_seen=data.get("last_seen"),
        is_active=data.get("is_active", True),
        created_by=user,
        updated_by=user,
    )

    # 🔥 AUTO CREATE CONFIG
    if device.mode == "SIMULATION":
        SimulationConfig.objects.get_or_create(device=device)

    logger.info(f"Device created {device.serial_number} | Mode: {device.mode}")

    return device


# 🔷 UPDATE
@transaction.atomic
def update_device(device_id, data, user):

    device = get_device_by_id(device_id)

    new_serial = data.get("serial_number", device.serial_number)
    bed = data.get("bed", device.bed)

    if not new_serial:
        raise ValidationError("Serial number is required")

    # 🔥 CASE-INSENSITIVE CHECK
    qs = Device.all_objects.filter(
        serial_number__iexact=new_serial,
        is_deleted=False,
    ).exclude(id=device.id)

    if qs.exists():
        raise ValidationError("Serial number already exists")

    # 🔥 BED VALIDATION
    if bed:
        qs = Device.all_objects.filter(
            bed=bed,
            is_deleted=False,
        ).exclude(id=device.id)

        if qs.exists():
            raise ValidationError("This bed already has a device")

    old_mode = device.mode
    new_mode = data.get("mode", device.mode)
    old_active = device.is_active
    new_active = data.get("is_active", device.is_active)

    # 🔒 ROLE ENFORCEMENT: Only Admins can change operational modes
    if old_mode != new_mode:
        if user and getattr(user, "role", None) != "ADMIN":
             raise ValidationError("Safety Block: Only hospital administrators can toggle operational hardware modes.")

    # ... rest of validation logic

    VALID_SIM_MODES = ["NORMAL", "CRITICAL", "RECOVERY", "GLOBAL"]
    sim_mode = data.get("simulation_mode", device.simulation_mode)

    if sim_mode not in VALID_SIM_MODES:
        raise ValidationError("Invalid simulation mode")

    # 🔥 STRICT MODE VALIDATION
    if new_mode == "REAL" and sim_mode != "GLOBAL":
        raise ValidationError("Real devices must use GLOBAL simulation mode")

    if new_mode == "SIMULATION" and sim_mode == "GLOBAL":
        raise ValidationError("Simulation devices must define behavior")

    # 🔥 RESET SIMULATION MEMORY CORRECTLY
    if old_mode != new_mode:
        # 🛡️ CLINICAL GUARD: Block REAL -> SIMULATION if critical alerts exist
        if old_mode == "REAL" and new_mode == "SIMULATION":
            if device.bed and device.bed.patient:
                critical_alerts = Alert.objects.filter(
                    patient=device.bed.patient,
                    status="ACTIVE",
                    severity="CRITICAL"
                ).exists()
                
                if critical_alerts:
                    raise ValidationError(
                        "Safety Block: Cannot switch to simulation while patient has active CRITICAL clinical alerts."
                    )

        device.last_hr = None
        device.last_spo2 = None
        device.last_temp = None
        device.last_rr = None
        device.last_sys = None
        device.last_dia = None

        logger.info(f"Simulation memory reset for {device.serial_number}")

        # 📋 STRUCTURED AUDIT LOG: MODE CHANGE
        audit_event = {
            "event": "DEVICE_MODE_CHANGED",
            "device_id": device.id,
            "device_serial": device.serial_number,
            "patient_id": device.bed.patient.id if device.bed and device.bed.patient else None,
            "from_mode": old_mode,
            "to_mode": new_mode,
            "triggered_by": user.username if user else "SYSTEM",
            "timestamp": timezone.now().isoformat()
        }
        audit_logger.info(json.dumps(audit_event))

        # 📋 STRUCTURED AUDIT LOG: SIMULATION START
        if new_mode == "SIMULATION" and old_mode != "SIMULATION":
            sim_event = audit_event.copy()
            sim_event["event"] = "SIMULATION_STARTED"
            audit_logger.info(json.dumps(sim_event))

    # 📋 STRUCTURED AUDIT LOG: DEVICE OFFLINE
    if old_active and not new_active:
        offline_event = {
            "event": "DEVICE_OFFLINE",
            "device_id": device.id,
            "device_serial": device.serial_number,
            "triggered_by": user.username if user else "SYSTEM",
            "timestamp": timezone.now().isoformat()
        }
        audit_logger.info(json.dumps(offline_event))

    # 🔧 ASSIGN FIELDS
    device.serial_number = new_serial
    device.bed = bed
    device.device_type = data.get("device_type", device.device_type)

    device.mode = new_mode
    device.simulation_mode = sim_mode

    device.status = data.get("status", device.status)

    device.firmware_version = data.get("firmware_version", device.firmware_version)
    device.ip_address = data.get("ip_address", device.ip_address)
    device.last_seen = data.get("last_seen", device.last_seen)
    device.is_active = data.get("is_active", device.is_active)

    device.updated_by = user

    device.save()

    # 🔥 ENSURE CONFIG EXISTS
    if device.mode == "SIMULATION":
        SimulationConfig.objects.get_or_create(device=device)

    logger.info(
        f"Device updated {device.serial_number} | Mode: {device.mode} | Sim: {device.simulation_mode}"
    )

    return device


# 🔷 DELETE
def delete_device(device_id, user):

    device = get_device_by_id(device_id)

    device.updated_by = user
    device.soft_delete()

    logger.info(f"Device deleted {device.serial_number}")

    return device