from rest_framework.exceptions import (
    NotFound,
    ValidationError,
)
from apps.patients.models import Patient
def get_all_patients():
    return Patient.objects.all().order_by(
        "-admission_date"
    )
def get_patient_by_id(patient_id):
    try:
        return Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        raise NotFound("Patient not found")
def create_patient(data, user):
    bed = data.get("bed")
    if bed:
        existing = Patient.all_objects.filter(
            bed=bed,
            is_deleted=False,
            is_active=True,
        )
        if existing.exists():
            raise ValidationError(
                "This bed already has a patient"
            )
    patient = Patient.objects.create(
        bed=bed,
        name=data.get("name"),
        age=data.get("age"),
        gender=data.get("gender"),
        diagnosis=data.get("diagnosis"),
        discharge_date=data.get("discharge_date"),
        is_active=data.get("is_active", True),
        created_by=user,
        updated_by=user,
    )
    return patient
def update_patient(patient_id, data, user):
    patient = get_patient_by_id(patient_id)
    bed = data.get(
        "bed",
        patient.bed,
    )
    if bed:
        existing = Patient.all_objects.filter(
            bed=bed,
            is_deleted=False,
            is_active=True,
        ).exclude(id=patient.id)

        if existing.exists():
            raise ValidationError(
                "This bed already has a patient"
            )
    patient.bed = bed
    patient.name = data.get(
        "name",
        patient.name,
    )
    patient.age = data.get(
        "age",
        patient.age,
    )
    patient.gender = data.get(
        "gender",
        patient.gender,
    )
    patient.diagnosis = data.get(
        "diagnosis",
        patient.diagnosis,
    )
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
    return patient
def delete_patient(patient_id, user):
    patient = get_patient_by_id(patient_id)
    patient.updated_by = user
    patient.soft_delete()
    return patient