from rest_framework import serializers
from apps.beds.models import Bed
class AdminBedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bed
        fields = [
            "id",
            "room",
            "bed_number",
            "status",
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
        room = data.get("room")
        bed_number = data.get("bed_number")
        qs = Bed.all_objects.filter(
            room=room,
            bed_number=bed_number,
            is_deleted=False,
        )
        if self.instance:
            qs = qs.exclude(
                id=self.instance.id
            )
        if qs.exists():
            raise serializers.ValidationError(
                "Bed already exists in this room"
            )
        return data