from rest_framework import serializers
from apps.vitals.models import Vital
from apps.devices.models import Device

class VitalSnapshotSerializer(serializers.Serializer):
    """
    ⚡ HIGH-SPEED SNAPSHOT FORMAT
    Plain Serializer for total control and avoiding ModelSerializer auto-mapping crashes.
    """
    device_id = serializers.IntegerField(source="id")
    device_serial = serializers.CharField(source="serial_number")
    device_label = serializers.CharField(source="monitor_label", allow_null=True)
    device_mode = serializers.CharField(source="mode")
    device_state = serializers.CharField()
    
    patient_id = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    ward_id = serializers.SerializerMethodField()
    room_id = serializers.SerializerMethodField()
    bed_id = serializers.SerializerMethodField()
    
    # Scalar Vitals (Cached in Device for Speed)
    heart_rate = serializers.FloatField(source="last_hr", allow_null=True)
    spo2 = serializers.FloatField(source="last_spo2", allow_null=True)
    temperature = serializers.FloatField(source="last_temp", allow_null=True)
    bp = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()

    def get_patient_id(self, obj):
        return obj.bed.patient.id if obj.bed and obj.bed.patient else None

    def get_patient_name(self, obj):
        return obj.bed.patient.name if obj.bed and obj.bed.patient else None

    def get_ward_id(self, obj):
        return obj.bed.room.ward.id if obj.bed and obj.bed.room and obj.bed.room.ward else None

    def get_room_id(self, obj):
        return obj.bed.room.id if obj.bed and obj.bed.room else None

    def get_bed_id(self, obj):
        return obj.bed.id if obj.bed else None

    def get_bp(self, obj):
        if obj.last_sys is not None and obj.last_dia is not None:
            return f"{obj.last_sys}/{obj.last_dia}"
        return None

    def get_timestamp(self, obj):
        dt = obj.last_simulated_at or obj.last_seen
        return dt.isoformat() if dt else None


class VitalHistoryItemSerializer(serializers.ModelSerializer):
    """
    📈 TIME-SERIES SERIALIZER
    Optimized for Recent History API.
    """
    device_id = serializers.IntegerField(source="device.id")
    bp = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source="recorded_at")

    class Meta:
        model = Vital
        fields = [
            "device_id", "heart_rate", "spo2", "respiratory_rate", 
            "temperature", "bp", "timestamp"
        ]

    def get_bp(self, obj):
        if obj.systolic_bp is not None and obj.diastolic_bp is not None:
            return f"{obj.systolic_bp}/{obj.diastolic_bp}"
        return None
