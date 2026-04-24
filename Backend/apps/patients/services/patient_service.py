from rest_framework.exceptions import (
    NotFound,
    ValidationError,
)

from apps.patients.models import Patient


VALID_MODES = ["SIMULATION", "REAL"]


def get_all_patients():
    return Patient.objects.all().order_by("-admission_date")


def get_patient_by_id(patient_id):
    try:
        return Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        raise NotFound("Patient not found")


def create_patient(data, user):

    bed = data.get("bed")

    if not bed:
        raise ValidationError("Patient must have a bed assigned")

    existing = Patient.all_objects.filter(
        bed=bed,
        is_deleted=False,
        is_active=True,
    )

    if existing.exists():
        raise ValidationError("This bed already has a patient")

    doctor = data.get("doctor")
    if doctor and doctor.role != "DOCTOR":
        raise ValidationError("Assigned user must be a doctor")

    mode = data.get("mode", "SIMULATION")

    if mode not in VALID_MODES:
        raise ValidationError("Invalid mode")

    patient = Patient.objects.create(
        bed=bed,
        name=data.get("name"),
        age=data.get("age"),
        gender=data.get("gender"),
        diagnosis=data.get("diagnosis"),
        doctor=doctor,
        mode=mode,
        discharge_date=data.get("discharge_date"),
        is_active=data.get("is_active", True),
        created_by=user,
        updated_by=user,
    )

    return patient


def update_patient(patient_id, data, user):

    patient = get_patient_by_id(patient_id)
    old_mode = patient.mode

    new_mode = data.get("mode", patient.mode)

    if new_mode not in VALID_MODES:
        raise ValidationError("Invalid mode")

    bed = data.get("bed", patient.bed)

    if not bed:
        raise ValidationError("Patient must have a bed assigned")

    existing = Patient.all_objects.filter(
        bed=bed,
        is_deleted=False,
        is_active=True,
    ).exclude(id=patient.id)

    if existing.exists():
        raise ValidationError("This bed already has a patient")

    doctor = data.get("doctor", patient.doctor)
    if doctor and doctor.role != "DOCTOR":
        raise ValidationError("Assigned user must be a doctor")

    patient.bed = bed
    patient.name = data.get("name", patient.name)
    patient.age = data.get("age", patient.age)
    patient.gender = data.get("gender", patient.gender)
    patient.diagnosis = data.get("diagnosis", patient.diagnosis)

    patient.doctor = doctor
    patient.mode = new_mode

    patient.discharge_date = data.get(
        "discharge_date",
        patient.discharge_date,
    )

    patient.is_active = data.get(
        "is_active",
        patient.is_active,
    )

    patient.updated_by = user
    patient.save()

    # 🔥 SYNC TO DEVICE (Clinical source of truth)
    # Always ensure device mode matches patient mode if assigned
    try:
        from apps.devices.services.device_service import update_device
        device = getattr(patient.bed, "device", None)
        if device and device.mode != patient.mode:
            update_device(
                device.id, 
                {
                    "mode": patient.mode,
                    "simulation_mode": "GLOBAL" if patient.mode == "REAL" else "NORMAL"
                }, 
                user
            )
            import logging
            logger = logging.getLogger("app")
            logger.info(f"Sync: Device {device.serial_number} mode updated to {patient.mode} to match patient")
    except Exception as e:
        import logging
        logger = logging.getLogger("app")
        logger.error(f"Failed to sync mode to device: {str(e)}")

    return patient


def delete_patient(patient_id, user):

    patient = get_patient_by_id(patient_id)

    patient.updated_by = user
    patient.soft_delete()

    return patient