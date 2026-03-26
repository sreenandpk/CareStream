from rest_framework import serializers
from apps.wards.models import Ward
class AdminWardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ward
        fields = [
            "id",
            "name",
            "floor",
            "description",
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
        name = data.get("name")
        floor = data.get("floor")
        qs = Ward.all_objects.filter(
            name=name,
            floor=floor,
            is_deleted=False,
        )
        if self.instance:
            qs = qs.exclude(
                id=self.instance.id
            )
        if qs.exists():
            raise serializers.ValidationError(
                "Ward already exists on this floor"
            )
        return data