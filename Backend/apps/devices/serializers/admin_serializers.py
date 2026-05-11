from rest_framework import serializers
from apps.devices.models import Device
from apps.beds.models import Bed
class AdminDeviceSerializer(serializers.ModelSerializer):
    bed_number = serializers.SerializerMethodField()
    room_number = serializers.SerializerMethodField()
    ward_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    
    # 🔥 Hierarchical IDs for Filtering (Explicitly named to avoid shadowing)
    ward_id = serializers.SerializerMethodField()
    room_id = serializers.SerializerMethodField()
    bed_id = serializers.SerializerMethodField()
    config_data = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()
    masked_key = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = [
            "id",
            "serial_number",
            "monitor_label",
            "bed",
            "bed_id",
            "room_id",
            "ward_id",
            "bed_number",
            "room_number",
            "ward_name",
            "patient_name",
            "device_type",
            "mode",
            "simulation_mode",
            "status",
            "device_state",
            "last_seen",
            "last_simulated_at",
            "is_active",
            "last_hr",
            "last_spo2",
            "last_temp",
            "last_rr",
            "last_sys",
            "last_dia",
            "config_data",
            "timestamp",
            "api_key",
            "masked_key",
            "key_created_at",
            "is_key_revoked",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", 
            "bed_id", 
            "room_id", 
            "ward_id", 
            "bed_number", 
            "room_number", 
            "ward_name", 
            "patient_name", 
            "device_state", 
            "config_data",
            "timestamp",
            "masked_key",
            "key_created_at",
            "is_key_revoked",
            "last_simulated_at",
            "api_key",
            "created_at",
            "updated_at"
        ]
        extra_kwargs = {
            "firmware_version": {"allow_blank": True, "required": False},
            "ip_address": {"allow_blank": True, "required": False},
        }

    def get_bed_id(self, obj):
        return obj.bed.id if obj.bed else None

    def get_room_id(self, obj):
        return obj.bed.room.id if obj.bed and obj.bed.room else None

    def get_ward_id(self, obj):
        return obj.bed.room.ward.id if obj.bed and obj.bed.room and obj.bed.room.ward else None

    def get_bed_number(self, obj):
        return obj.bed.bed_number if obj.bed else None

    def get_room_number(self, obj):
        return obj.bed.room.room_number if obj.bed and obj.bed.room else None

    def get_ward_name(self, obj):
        return obj.bed.room.ward.name if obj.bed and obj.bed.room and obj.bed.room.ward else None

    def get_patient_name(self, obj):
        if not obj.bed:
            return None
        
        # 🔥 OneToOne reverse lookup: Safe navigation
        patient = getattr(obj.bed, "patient", None)
        return patient.name if patient else None

    def get_config_data(self, obj):
        config = getattr(obj, "simulation_config", None)
        if config:
            return {
                "id": config.id,
                "mode": config.mode,
                "trend": config.trend,
                "variability": config.variability,
            }
        return None

    def get_timestamp(self, obj):
        # 🔥 Return the most recent activity marker
        ts = obj.last_simulated_at or obj.last_seen
        return ts.isoformat() if ts else None

    def get_masked_key(self, obj):
        if not obj.api_key:
            return "N/A"
        return f"{obj.api_key[:4]}...{obj.api_key[-4:]}"

    def validate(self, data):
        serial_number = data.get("serial_number")
        bed = data.get("bed")
        qs = Device.all_objects.filter(
            serial_number=serial_number,
            is_deleted=False,
        )
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError(
                "Serial number already exists"
            )
        if bed:
            qs = Device.all_objects.filter(
                bed=bed,
                is_deleted=False,
            )
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
                raise serializers.ValidationError(
                    "This bed already has a device"
                )
        return data