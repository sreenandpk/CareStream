from rest_framework import serializers
from apps.alerts.models import Alert


class NurseAlertSerializer(serializers.ModelSerializer):

    patient_name = serializers.CharField(source="patient.name", read_only=True)
    device_name = serializers.CharField(source="device.serial_number", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id",
            "patient_name",
            "device_name",
            "alert_type",
            "message",
            "severity",
            "status",
            "created_at",
        ]
        read_only_fields = fields