from rest_framework import serializers
from apps.patients.models import Patient


class NursePatientSerializer(serializers.ModelSerializer):

    bed_number = serializers.CharField(source="bed.bed_number", read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "name",
            "age",
            "gender",
            "diagnosis",
            "mode",
            "bed",
            "bed_number",
            "admission_date",
            "discharge_date",
        ]