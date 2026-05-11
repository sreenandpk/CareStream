from rest_framework import serializers
from apps.patients.models import Patient, ClinicalNote


class ClinicalNoteSerializer(serializers.ModelSerializer):
    nurse_name = serializers.CharField(source="nurse.username", read_only=True)

    class Meta:
        model = ClinicalNote
        fields = [
            "id", "patient", "nurse", "nurse_name", 
            "content", "created_at"
        ]
        read_only_fields = ["nurse", "created_at"]


class NursePatientSerializer(serializers.ModelSerializer):
    bed_number = serializers.CharField(source="bed.bed_number", read_only=True)
    device_serial = serializers.CharField(source="bed.device.serial_number", read_only=True)
    device_id = serializers.IntegerField(source="bed.device.id", read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "name",
            "age",
            "gender",
            "diagnosis",
            "clinical_condition",
            "ai_condition_summary",
            "last_ai_assessment",
            "mode",
            "bed",
            "bed_number",
            "device_serial",
            "device_id",
            "admission_date",
            "discharge_date",
        ]