from rest_framework import serializers
from apps.patients.models import Patient
from apps.beds.models import Bed
class AdminPatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            "id",
            "bed",
            "name",
            "age",
            "gender",
            "diagnosis",
            "admission_date",
            "discharge_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "admission_date",
            "created_at",
            "updated_at",
        ]
    def validate(self, data):
        bed = data.get("bed")
        if bed:
            qs = Patient.all_objects.filter(
                bed=bed,
                is_deleted=False,
            )
            if self.instance:
                qs = qs.exclude(
                    id=self.instance.id
                )
            if qs.exists():
                raise serializers.ValidationError(
                    "This bed already has a patient"
                )
        return data