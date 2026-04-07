from rest_framework import serializers
from apps.devices.models import Device


class DoctorDeviceSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(
        source="bed.patient.name",
        read_only=True
    )

    class Meta:
        model = Device
        fields = [
            "id",
            "serial_number",
            "device_type",
            "status",
            "bed",
            "patient_name",
            "last_seen",
        ]