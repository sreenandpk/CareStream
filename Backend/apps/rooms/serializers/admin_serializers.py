from rest_framework import serializers
from apps.rooms.models import Room
class AdminRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "ward",
            "room_number",
            "room_type",
            "capacity",
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
        ward = data.get("ward")
        room_number = data.get("room_number")
        qs = Room.all_objects.filter(
            ward=ward,
            room_number=room_number,
            is_deleted=False,
        )
        if self.instance:
            qs = qs.exclude(
                id=self.instance.id
            )
        if qs.exists():
            raise serializers.ValidationError(
                "Room already exists in this ward"
            )
        return data