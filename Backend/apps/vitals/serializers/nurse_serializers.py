from rest_framework import serializers
from apps.vitals.models import Vital


class NurseVitalSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(source="patient.name", read_only=True)

    class Meta:
        model = Vital
        fields = [
            "id",
            "patient",
            "patient_name",
            "heart_rate",
            "spo2",
            "temperature",
            "systolic_bp",
            "diastolic_bp",
            "recorded_at",
        ]