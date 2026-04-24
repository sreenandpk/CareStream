from rest_framework.exceptions import NotFound, ValidationError
import logging
from django.db import transaction

from apps.vitals.models import Vital
from apps.alerts.services.alert_service import check_and_create_alert
from apps.vitals.services.waveform_service import WaveformGenerator

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger("vitals")

# 🔷 GET ALL
def get_all_vitals():
    return Vital.objects.all().order_by("-recorded_at")


# 🔷 GET BY ID
def get_vital_by_id(vital_id):
    try:
        return Vital.objects.get(id=vital_id)
    except Vital.DoesNotExist:
        raise NotFound("Vital not found")


@transaction.atomic
def create_vital(data, user=None):
    """
    🚀 CENTRALIZED VITAL INGESTION ENGINE
    Strictly handles: Validation -> Storage -> Waveform -> Broadcast -> Alert Engine
    """
    device = data.get("device")
    patient = data.get("patient")
    # 🛡️ ARCHITECTURAL SOURCE CONTROL
    # Derive source from hardware mode (Hardware-First Principle)
    source = "SIMULATION" if device.mode == "SIMULATION" else "DEVICE"
    
    # 🔥 1. PERSIST VITAL
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
        created_by=user,
        updated_by=user,
    )

    # 🔥 2. GENERATE WAVEFORMS (Clinical Accuracy)
    waveform_ecg = WaveformGenerator.generate_ecg_buffer(vital.heart_rate)
    waveform_spo2 = WaveformGenerator.generate_spo2_buffer(vital.spo2)
    waveform_resp = WaveformGenerator.generate_resp_buffer(vital.respiratory_rate)

    # 🔥 3. BROADCAST TELEMETRY (Standardized Event Layer)
    try:
        channel_layer = get_channel_layer()
        doctor_id = getattr(vital.patient.doctor, "id", None) if vital.patient else None
        
        groups = ["vitals_admin"]
        if doctor_id:
            groups.append(f"vitals_doctor_{doctor_id}")

        broadcast_payload = {
            "event": "VITAL_UPDATE",  # 🚨 PRODUCTION CONTRACT
            "data": {
                "device": {
                    "id": device.id,
                    "serial": device.serial_number,
                    "label": device.monitor_label,
                    "mode": device.mode,
                    "state": device.device_state,
                    "last_seen": vital.recorded_at.isoformat(),
                },
                "patient": {
                    "id": vital.patient.id if vital.patient else None,
                    "name": getattr(vital.patient, "name", "ANONYMOUS"),
                    "location": f"Bed {device.bed.bed_number}" if device.bed else "UNASSIGNED",
                    "ward_id": device.bed.room.ward.id if device.bed and device.bed.room else None,
                },
                "vitals": {
                    "heart_rate": vital.heart_rate,
                    "spo2": vital.spo2,
                    "respiratory_rate": vital.respiratory_rate,
                    "temperature": vital.temperature,
                    "bp": f"{vital.systolic_bp}/{vital.diastolic_bp}",
                    "timestamp": vital.recorded_at.isoformat(),
                },
                "waveform": {
                    "ecg": waveform_ecg,
                    "spo2": waveform_spo2,
                    "resp": waveform_resp
                }
            }
        }

        for group in groups:
            async_to_sync(channel_layer.group_send)(
                group,
                {
                    "type": "send_vital",
                    "data": broadcast_payload
                }
            )
        logger.info(f"Broadcast: VITAL_UPDATE synced for {device.serial_number}")

    except Exception as e:
        logger.error(f"Telemetry Failure: {str(e)}")

    # 🔥 4. HEARTBEAT UPDATE (Clinical Synchronization)
    try:
        from apps.devices.models import Device
        if device.mode == "SIMULATION":
            Device.objects.filter(pk=device.pk).update(last_simulated_at=vital.recorded_at)
        else:
            Device.objects.filter(pk=device.pk).update(last_seen=vital.recorded_at)
    except Exception as e:
        logger.error(f"Heartbeat Update Failure: {str(e)}")

    # 🔥 5. TRIGGER ALERT ENGINE
    try:
        check_and_create_alert(vital)
    except Exception as e:
        logger.error(f"Alert Engine Failure: {str(e)}")

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
    vital.respiratory_rate = data.get("respiratory_rate", vital.respiratory_rate)
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