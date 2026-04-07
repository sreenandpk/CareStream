from rest_framework import serializers
from apps.beds.models import Bed


class NurseBedSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(
        source="patient.name",
        read_only=True
    )

    class Meta:
        model = Bed
        fields = [
            "id",
            "room",
            "bed_number",
            "status",
            "patient_name",
        ]