from rest_framework.exceptions import NotFound, ValidationError

from apps.vitals.models import Vital
from apps.alerts.services.alert_service import check_and_create_alert

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


# 🔷 GET ALL
def get_all_vitals():
    return Vital.objects.all().order_by("-recorded_at")


# 🔷 GET BY ID
def get_vital_by_id(vital_id):
    try:
        return Vital.objects.get(id=vital_id)
    except Vital.DoesNotExist:
        raise NotFound("Vital not found")


# 🔷 CREATE
def create_vital(data, user):

    device = data.get("device")
    patient = data.get("patient")
    source = data.get("source")

    if not device:
        raise ValidationError("Device is required")

    if not source:
        raise ValidationError("Source is required")

    if not hasattr(device, "bed"):
        raise ValidationError("Device not assigned to bed")

    if patient and source == "DEVICE":
        if device.bed.patient != patient:
            raise ValidationError("Patient does not match device bed")

    if patient:
        if patient.mode == "SIMULATION" and source != "SIMULATION":
            raise ValidationError("Simulation patient must use SIMULATION source")

        if patient.mode == "REAL" and source != "DEVICE":
            raise ValidationError("Real patient must use DEVICE source")

    vital = Vital.objects.create(
        device=device,
        patient=patient,
        source=source,
        heart_rate=data.get("heart_rate"),
        spo2=data.get("spo2"),
        respiratory_rate=data.get("respiratory_rate"),
        temperature=data.get("temperature"),
        systolic_bp=data.get("systolic_bp"),
        diastolic_bp=data.get("diastolic_bp"),
        created_by=user if user else None,
        updated_by=user if user else None,
    )

    print(f"✅ Vital CREATED: {vital.id}")

    # 🔥 SEND TO WEBSOCKET (MULTI GROUP)
    channel_layer = get_channel_layer()

    doctor = getattr(vital.patient, "doctor", None)

    groups = ["vitals_admin"]

    if doctor:
        groups.append(f"vitals_doctor_{doctor.id}")

    for group in groups:
        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "send_vital",
                "data": {
                    "patient_id": vital.patient.id if vital.patient else None,
                    "patient_name": vital.patient.name if vital.patient else None,
                    "heart_rate": vital.heart_rate,
                    "spo2": vital.spo2,
                    "temperature": vital.temperature,
                    "bp": f"{vital.systolic_bp}/{vital.diastolic_bp}",
                    "timestamp": str(vital.recorded_at),
                }
            }
        )

    print(f"📡 VITAL SENT TO {groups}")

    # 🔥 ALERT ENGINE
    check_and_create_alert(vital)

    return vital

# 🔷 UPDATE
def update_vital(vital_id, data, user):

    vital = get_vital_by_id(vital_id)

    device = data.get("device", vital.device)
    patient = data.get("patient", vital.patient)
    source = data.get("source", vital.source)

    if not device:
        raise ValidationError("Device is required")

    if not hasattr(device, "bed"):
        raise ValidationError("Device not assigned to bed")

    if patient and device.bed.patient != patient:
        raise ValidationError("Patient does not match device bed")

    if patient:
        if patient.mode == "SIMULATION" and source != "SIMULATION":
            raise ValidationError("Simulation patient must use SIMULATION source")

        if patient.mode == "REAL" and source != "DEVICE":
            raise ValidationError("Real patient must use DEVICE source")

    vital.device = device
    vital.patient = patient
    vital.source = source

    vital.heart_rate = data.get("heart_rate", vital.heart_rate)
    vital.spo2 = data.get("spo2", vital.spo2)
    vital.respiratory_rate = data.get("respiratory_rate", vital.respiratory_rate)
    vital.temperature = data.get("temperature", vital.temperature)
    vital.systolic_bp = data.get("systolic_bp", vital.systolic_bp)
    vital.diastolic_bp = data.get("diastolic_bp", vital.diastolic_bp)

    vital.is_active = data.get("is_active", vital.is_active)

    vital.updated_by = user
    vital.save()

    return vital


# 🔷 DELETE
def delete_vital(vital_id, user):

    vital = get_vital_by_id(vital_id)

    vital.updated_by = user
    vital.soft_delete()

    return vital