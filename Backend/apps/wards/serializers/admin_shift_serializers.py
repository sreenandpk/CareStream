from rest_framework import serializers
from apps.wards.models import NurseShift
from django.contrib.auth import get_user_model

User = get_user_model()

class AdminNurseShiftSerializer(serializers.ModelSerializer):
    nurse_username = serializers.CharField(source="nurse.username", read_only=True)
    ward_name = serializers.CharField(source="ward.name", read_only=True)
    
    class Meta:
        model = NurseShift
        fields = [
            "id",
            "nurse",
            "nurse_username",
            "ward",
            "ward_name",
            "shift_type",
            "start_time",
            "end_time",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """
        Validate that start_time is before end_time.
        """
        if data.get("start_time") and data.get("end_time"):
            if data["start_time"] >= data["end_time"]:
                raise serializers.ValidationError("Start time must be before end time.")
        return data
