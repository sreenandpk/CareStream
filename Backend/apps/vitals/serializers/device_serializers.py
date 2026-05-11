from rest_framework import serializers

class DeviceIngestionSerializer(serializers.Serializer):
    """
    🚀 Telemetry Ingestion Serializer
    Validates incoming clinical frames from hardware monitors.
    """
    serial_number = serializers.CharField(max_length=50)
    heart_rate = serializers.FloatField(required=False, allow_null=True)
    spo2 = serializers.FloatField(required=False, allow_null=True)
    temperature = serializers.FloatField(required=False, allow_null=True)
    systolic_bp = serializers.IntegerField(required=False, allow_null=True)
    diastolic_bp = serializers.IntegerField(required=False, allow_null=True)
    
    # Waveform data (Optional high-res telemetry)
    waveform = serializers.JSONField(required=False)

    # System Health (Hardware Metrics)
    rssi = serializers.IntegerField(required=False, allow_null=True)
    uptime = serializers.IntegerField(required=False, allow_null=True)
    signal_quality = serializers.CharField(required=False, max_length=20)
    sensor_connected = serializers.BooleanField(required=False)
    device_mode = serializers.CharField(required=False, max_length=20)
    signal_state = serializers.CharField(required=False, max_length=20)

    def validate(self, data):
        # Ensure at least some data is present
        vital_fields = ["heart_rate", "spo2", "temperature", "systolic_bp", "diastolic_bp"]
        signal_state = data.get("signal_state", "GOOD")
        
        # If signal is LOST, we allow all vitals to be null
        if signal_state == "LOST":
            return data
            
        if not any(data.get(field) is not None for field in vital_fields):
            raise serializers.ValidationError("Incomplete Frame: At least one clinical metric must be broadcasted.")
        return data
