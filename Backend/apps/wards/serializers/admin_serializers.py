from rest_framework import serializers
from apps.wards.models import Ward

class AdminWardSerializer(serializers.ModelSerializer):
    nurse_details = serializers.SerializerMethodField()
    class Meta:
        model = Ward
        fields = [
            "id",
            "name",
            "floor",
            "description",
            "nurses",
            "nurse_details",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def get_nurse_details(self, obj):
        return [
            {"id": n.id, "username": n.username}
            for n in obj.nurses.all()
        ]

    def validate(self, data):
        # 🔥 SUPPORT PARTIAL UPDATES: Only validate if fields are present
        name = data.get("name")
        floor = data.get("floor")

        if name is not None and floor is not None:
            qs = Ward.all_objects.filter(
                name=name,
                floor=floor,
                is_deleted=False,
            )
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            
            if qs.exists():
                raise serializers.ValidationError(
                    "Ward already exists on this floor"
                )
        return data