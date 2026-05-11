from rest_framework import serializers
from apps.patients.models import Patient
from apps.beds.models import Bed
from django.contrib.auth import get_user_model

User = get_user_model()


class AdminPatientSerializer(serializers.ModelSerializer):

    # 🔥 ADD THESE
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="DOCTOR"),
        required=False,
        allow_null=True
    )

    primary_nurse = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="NURSE"),
        required=False,
        allow_null=True
    )

    mode = serializers.ChoiceField(
        choices=Patient.MODE_CHOICES,
        required=False
    )

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # 🔥 Override mode with hardware state (Single Source of Truth)
        try:
            device = getattr(instance.bed, "device", None)
            if device:
                ret["mode"] = device.mode
        except Exception:
            pass
        return ret

    class Meta:
        model = Patient
        fields = [
            "id",
            "bed",
            "doctor",  
            "primary_nurse",
            "mode",     
            "name",
            "age",
            "gender",
            "diagnosis",
            "clinical_condition",
            "ai_condition_summary",
            "last_ai_assessment",
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

    # 🔥 BED VALIDATION
    def validate(self, data):
        bed = data.get("bed")

        if bed:
            qs = Patient.all_objects.filter(
                bed=bed,
                is_deleted=False,
                is_active=True,
            )

            if self.instance:
                qs = qs.exclude(id=self.instance.id)

            if qs.exists():
                raise serializers.ValidationError(
                    "This bed already has a patient"
                )

        return data

    # 🔥 DOCTOR VALIDATION (EXTRA SAFETY)
    def validate_doctor(self, value):
        if value and value.role != "DOCTOR":
            raise serializers.ValidationError(
                "Assigned user must be a doctor"
            )
        return value

    # 🔥 NURSE VALIDATION
    def validate_primary_nurse(self, value):
        if value and value.role != "NURSE":
            raise serializers.ValidationError(
                "Assigned user must be a nurse"
            )
        return value