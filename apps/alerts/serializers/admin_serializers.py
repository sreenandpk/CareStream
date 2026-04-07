from rest_framework import serializers
from apps.alerts.models import Alert


class AdminAlertSerializer(serializers.ModelSerializer):

    class Meta:
        model = Alert
        fields = [
            "id",
            "device",
            "patient",
            "vital",
            "doctor",
            "alert_type",
            "message",
            "severity",
            "status",
            "acknowledged_at",
            "resolved_at",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "acknowledged_at",
            "resolved_at",
        ]

    def validate(self, data):

        device = data.get("device")
        patient = data.get("patient")
        vital = data.get("vital")

        if device and patient and device.bed.patient != patient:
            raise serializers.ValidationError(
                "Device does not match patient's bed"
            )

        if vital and patient and vital.patient != patient:
            raise serializers.ValidationError(
                "Vital does not belong to patient"
            )

        return data