from rest_framework import serializers
from apps.wards.models import Ward
class DoctorWardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ward
        fields = [
            "id",
            "name",
            "floor",
            "description",
        ]