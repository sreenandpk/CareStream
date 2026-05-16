from rest_framework.exceptions import NotFound, ValidationError
import logging
from django.db import transaction

from apps.vitals.models import Vital
from apps.alerts.services.alert_service import check_and_create_alert
from apps.vitals.services.waveform_service import WaveformEngine
from apps.vitals.services.clinical_logic import derive_system_condition, get_clinical_suggestion
from apps.vitals.services.ml_condition_service import MLConditionService

from channels.layers import get_channel_layer
from django.utils import timezone
from asgiref.sync import async_to_sync

logger = logging.getLogger("vitals")

def generate_waveform_data(vital, device, data):
    """
    📈 STATEFUL WAVEFORM GENERATION
    Generates high-fidelity clinical buffers synced to real patient HR.
    """
    # 🏥 CLINICAL LOGIC: If signal is LOST, we flatline
    signal_state = data.get("signal_state", "GOOD")
    
    if signal_state == "LOST":
        hr = 0
        rr = 0
    else:
        hr = vital.heart_rate or 75
        rr = 18 

    serial = device.serial_number

    waveform_ecg = WaveformEngine.generate_ecg_buffer(hr, points=50, device_id=serial, quality=signal_state)
    waveform_spo2 = WaveformEngine.generate_pleth_buffer(hr, points=50, device_id=serial, quality=signal_state)
    waveform_resp = WaveformEngine.generate_resp_buffer(rr, points=50, device_id=serial)

    return waveform_ecg, waveform_spo2, waveform_resp

# 🔷 GET ALL
def get_all_vitals():
    return Vital.objects.all().order_by("-recorded_at")


# 🔷 GET BY ID
def get_vital_by_id(vital_id):
    try:
        return Vital.objects.get(id=vital_id)
    except Vital.DoesNotExist:
        raise NotFound("Vital not found")


def create_vital(data, user=None):
    """
    🚀 HIGH-PERFORMANCE VITAL INGESTION
    """
    device = data.get("device")
    patient = data.get("patient")
    source = "SIMULATION" if device.mode == "SIMULATION" else "DEVICE"
    
    # 🔥 1. PERSIST VITAL (Fastest possible write)
    vital = Vital.objects.create(
        device=device,
        patient=patient,
        source=source,
        heart_rate=data.get("heart_rate"),
        spo2=data.get("spo2"),
        temperature=data.get("temperature"),
        systolic_bp=data.get("systolic_bp"),
        diastolic_bp=data.get("diastolic_bp"),
    )

    # 🔥 2. UPDATE DEVICE STATE (Ensures 'LIVE' status in broadcast)
    if device.is_simulation:
        device.last_simulated_at = timezone.now()
        device.save(update_fields=['last_simulated_at'])

    # 🔥 3. GENERATE WAVEFORMS
    if data.get("signal_state") == "LOST":
        waveform_ecg, waveform_spo2, waveform_resp = [0.0] * 50, [0.0] * 50, [0.0] * 50
    else:
        waveform_ecg, waveform_spo2, waveform_resp = generate_waveform_data(vital, device, data)

    # 🔥 3. BROADCAST TELEMETRY
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            groups = ["vitals_admin"]
            if device.bed and device.bed.room:
                groups.append(f"vitals_ward_{device.bed.room.ward_id}")

            broadcast_payload = {
                "event": "VITAL_UPDATE",
                "data": {
                    "device": {
                        "id": device.id,
                        "serial": device.serial_number,
                        "label": device.monitor_label,
                        "mode": device.mode,
                        "state": device.device_state,
                    },
                    "patient": {
                        "id": (device.bed.patient.id if device.bed and device.bed.patient else None),
                        "name": (device.bed.patient.name if device.bed and device.bed.patient else "ANONYMOUS"),
                        "location": f"Bed {device.bed.bed_number}" if device.bed else "UNASSIGNED",
                        "ward_id": device.bed.room.ward_id if device.bed and device.bed.room else None,
                        "room_id": device.bed.room_id if device.bed else None,
                        "bed_id": device.bed_id if device.bed else None,
                    },
                    "vitals": {
                        "heart_rate": vital.heart_rate,
                        "spo2": vital.spo2,
                        "temperature": vital.temperature,
                        "bp": f"{vital.systolic_bp}/{vital.diastolic_bp}",
                        "timestamp": vital.recorded_at.isoformat() if hasattr(vital, "recorded_at") else timezone.now().isoformat(),
                    },
                    "system": {
                        "signal_state": data.get("signal_state", "GOOD"),
                    },
                    "ai_condition_summary": "Stable Observation",
                    "ai_suggestion": "Continue monitoring",
                    "waveform": {
                        "ecg": waveform_ecg,
                        "spo2": waveform_spo2,
                    }
                }
            }

            for group in groups:
                async_to_sync(channel_layer.group_send)(
                    group,
                    {"type": "send_vital", "data": broadcast_payload}
                )
    except Exception:
        pass

    return vital


# 🔷 UPDATE
@transaction.atomic
def update_vital(vital_id, data, user):

    vital = get_vital_by_id(vital_id)

    device = data.get("device", vital.device)
    patient = data.get("patient", vital.patient)
    source = data.get("source", vital.source)

    if not device:
        raise ValidationError("Device is required")

    if not device.bed:
        raise ValidationError("Device not assigned to bed")

    if patient and device.bed.patient != patient:
        raise ValidationError("Patient mismatch with device bed")

    if device.mode == "SIMULATION" and source != "SIMULATION":
        raise ValidationError("Simulation device cannot receive real data")

    if device.mode == "REAL" and source != "DEVICE":
        raise ValidationError("Real device cannot receive simulation data")

    # 🔧 Update fields
    vital.device = device
    vital.patient = patient
    vital.source = source

    vital.heart_rate = data.get("heart_rate", vital.heart_rate)
    vital.spo2 = data.get("spo2", vital.spo2)
    vital.temperature = data.get("temperature", vital.temperature)
    vital.systolic_bp = data.get("systolic_bp", vital.systolic_bp)
    vital.diastolic_bp = data.get("diastolic_bp", vital.diastolic_bp)

    vital.is_active = data.get("is_active", vital.is_active)
    vital.updated_by = user

    vital.save()

    logger.info(f"Vital updated ID={vital.id}")

    return vital


# 🔷 DELETE
def delete_vital(vital_id, user):

    vital = get_vital_by_id(vital_id)

    vital.updated_by = user
    vital.soft_delete()

    logger.info(f"Vital deleted ID={vital.id}")

    return vital