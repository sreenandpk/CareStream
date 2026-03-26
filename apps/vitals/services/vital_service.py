from rest_framework.exceptions import NotFound
from apps.vitals.models import Vital
def get_all_vitals():
    return Vital.objects.all().order_by(
        "-recorded_at"
    )
def get_vital_by_id(vital_id):
    try:
        return Vital.objects.get(id=vital_id)
    except Vital.DoesNotExist:
        raise NotFound("Vital not found")
def create_vital(data, user):
    vital = Vital.objects.create(
        device=data.get("device"),
        patient=data.get("patient"),
        heart_rate=data.get("heart_rate"),
        spo2=data.get("spo2"),
        respiratory_rate=data.get("respiratory_rate"),
        temperature=data.get("temperature"),
        systolic_bp=data.get("systolic_bp"),
        diastolic_bp=data.get("diastolic_bp"),
        is_active=data.get("is_active", True),
        created_by=user,
        updated_by=user,
    )
    return vital
def update_vital(vital_id, data, user):
    vital = get_vital_by_id(vital_id)
    vital.device = data.get(
        "device",
        vital.device,
    )
    vital.patient = data.get(
        "patient",
        vital.patient,
    )
    vital.heart_rate = data.get(
        "heart_rate",
        vital.heart_rate,
    )
    vital.spo2 = data.get(
        "spo2",
        vital.spo2,
    )
    vital.respiratory_rate = data.get(
        "respiratory_rate",
        vital.respiratory_rate,
    )
    vital.temperature = data.get(
        "temperature",
        vital.temperature,
    )
    vital.systolic_bp = data.get(
        "systolic_bp",
        vital.systolic_bp,
    )
    vital.diastolic_bp = data.get(
        "diastolic_bp",
        vital.diastolic_bp,
    )
    vital.is_active = data.get(
        "is_active",
        vital.is_active,
    )
    vital.updated_by = user
    vital.save()
    return vital
def delete_vital(vital_id, user):
    vital = get_vital_by_id(vital_id)
    vital.updated_by = user
    vital.soft_delete()
    return vital