from rest_framework import serializers
from apps.vitals.models import Vital
class AdminVitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vital
        fields = [
            "id",
            "device",
            "patient",
            "heart_rate",
            "spo2",
            "respiratory_rate",
            "temperature",
            "systolic_bp",
            "diastolic_bp",
            "recorded_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "recorded_at",
            "created_at",
            "updated_at",
        ]
    def validate(self, data):
        device = data.get("device")
        if not device:
            raise serializers.ValidationError(
                "Device is required"
            )
        return data