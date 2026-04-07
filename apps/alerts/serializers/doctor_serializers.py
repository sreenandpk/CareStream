from rest_framework import serializers
from apps.alerts.models import Alert


class DoctorAlertSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.name", read_only=True)
    device_name = serializers.CharField(source="device.serial_number", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id",
            "patient",
            "patient_name",
            "device",
            "device_name",
            "alert_type",
            "message",
            "severity",
            "status",
            "acknowledged_at",
            "resolved_at",
            "created_at",
        ]
        read_only_fields = fields