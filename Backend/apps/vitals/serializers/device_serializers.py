from rest_framework import serializers

class DeviceIngestionSerializer(serializers.Serializer):
    """
    🚀 Telemetry Ingestion Serializer
    Validates incoming clinical frames from hardware monitors.
    """
    serial_number = serializers.CharField(max_length=50)
    heart_rate = serializers.FloatField(required=False, allow_null=True)
    spo2 = serializers.FloatField(required=False, allow_null=True)
    respiratory_rate = serializers.FloatField(required=False, allow_null=True)
    temperature = serializers.FloatField(required=False, allow_null=True)
    systolic_bp = serializers.IntegerField(required=False, allow_null=True)
    diastolic_bp = serializers.IntegerField(required=False, allow_null=True)
    
    # Waveform data (Optional high-res telemetry)
    waveform = serializers.JSONField(required=False)

    def validate(self, data):
        # Ensure at least some vital data is present
        vital_fields = ["heart_rate", "spo2", "respiratory_rate", "temperature", "systolic_bp", "diastolic_bp"]
        if not any(data.get(field) is not None for field in vital_fields):
            raise serializers.ValidationError("Incomplete Frame: At least one clinical metric must be broadcasted.")
        return data
