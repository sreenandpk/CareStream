from rest_framework import serializers
from apps.vitals.models import Vital


class DoctorVitalSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(source="patient.name", read_only=True)

    class Meta:
        model = Vital
        fields = [
            "id",
            "patient",
            "patient_name",
            "heart_rate",
            "spo2",
            "respiratory_rate",
            "temperature",
            "systolic_bp",
            "diastolic_bp",
            "recorded_at",
        ]