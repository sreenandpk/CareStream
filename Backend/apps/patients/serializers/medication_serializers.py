from rest_framework import serializers
from apps.patients.models import MedicationOrder, MedicationAdministration
from django.contrib.auth import get_user_model

User = get_user_model()

class MedicationAdministrationSerializer(serializers.ModelSerializer):
    nurse_name = serializers.CharField(source="nurse.username", read_only=True)

    class Meta:
        model = MedicationAdministration
        fields = [
            "id", "order", "nurse", "nurse_name", 
            "administered_at", "status", "notes"
        ]
        read_only_fields = ["nurse", "administered_at"]

class MedicationOrderSerializer(serializers.ModelSerializer):
    prescribed_by_name = serializers.CharField(source="prescribed_by.username", read_only=True)
    last_administration = serializers.SerializerMethodField()

    class Meta:
        model = MedicationOrder
        fields = [
            "id", "patient", "medication_name", "dosage", 
            "route", "frequency", "prescribed_by", 
            "prescribed_by_name", "is_active", "notes",
            "last_administration"
        ]
        read_only_fields = ["prescribed_by"]

    def get_last_administration(self, obj):
        last = obj.administrations.first()
        if last:
            return MedicationAdministrationSerializer(last).data
        return None
