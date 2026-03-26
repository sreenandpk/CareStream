from rest_framework import serializers
from apps.devices.models import Device
from apps.beds.models import Bed
class AdminDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = [
            "id",
            "serial_number",
            "bed",
            "device_type",
            "status",
            "firmware_version",
            "ip_address",
            "last_seen",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]
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