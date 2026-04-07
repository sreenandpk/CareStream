from rest_framework import serializers
from apps.rooms.models import Room

class NurseRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "ward",
            "room_number",
            "room_type",
            "capacity",
        ]