from rest_framework import serializers
from apps.vitals.models import Vital


class AdminVitalSerializer(serializers.ModelSerializer):

    # 🔥 ADD SOURCE
    source = serializers.ChoiceField(
        choices=Vital.Source.choices
    )

    class Meta:
        model = Vital
        fields = [
            "id",
            "device",
            "patient",
            "source",  # 🔥 NEW
            "heart_rate",
            "spo2",
            "temperature",
            "systolic_bp",
            "diastolic_bp",
            "recorded_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "recorded_at",
            "created_at",
            "updated_at",
        ]

    # 🔥 MAIN VALIDATION
    def validate(self, data):

        device = data.get("device")
        patient = data.get("patient")
        source = data.get("source")

        # ✅ Device required
        if not device:
            raise serializers.ValidationError("Device is required")

        # 🔥 Device must be linked to bed
        if not hasattr(device, "bed"):
            raise serializers.ValidationError("Device is not assigned to any bed")

        # 🔥 Patient must match device bed
        if patient and device.bed.patient != patient:
            raise serializers.ValidationError(
                "Patient does not match device's bed"
            )

        # 🔥 Source vs patient mode check (VERY IMPORTANT)
        if patient:
            if patient.mode == "SIMULATION" and source != "SIMULATION":
                raise serializers.ValidationError(
                    "Simulation patient must use SIMULATION source"
                )

            if patient.mode == "REAL" and source != "DEVICE":
                raise serializers.ValidationError(
                    "Real patient must use DEVICE source"
                )

        return data