from rest_framework import serializers
from apps.patients.models import Patient, MedicationOrder


class MedicationOrderSerializer(serializers.ModelSerializer):
    prescribed_by_name = serializers.CharField(source="prescribed_by.username", read_only=True)
    administered_status = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicationOrder
        fields = [
            "id",
            "medication_name",
            "dosage",
            "route",
            "frequency",
            "is_active",
            "notes",
            "prescribed_by_name",
            "administered_status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_administered_status(self, obj):
        # 🔥 Return the most recent administration info if any
        last_admin = obj.administrations.order_by("-administered_at").first()
        if last_admin:
            return {
                "status": last_admin.status,
                "nurse": last_admin.nurse.username,
                "time": last_admin.administered_at.isoformat()
            }
        return None


class DoctorPatientSerializer(serializers.ModelSerializer):
    bed_number = serializers.CharField(source="bed.bed_number", read_only=True)
    device_serial = serializers.CharField(source="bed.device.serial_number", read_only=True)
    device_id = serializers.IntegerField(source="bed.device.id", read_only=True)
    clinical_notes = serializers.SerializerMethodField()
    medication_orders = serializers.SerializerMethodField()
    last_condition_update_by_name = serializers.CharField(source="last_condition_update_by.username", read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "name",
            "age",
            "gender",
            "diagnosis",
            "clinical_condition",
            "mode",
            "bed",
            "bed_number",
            "device_serial",
            "device_id",
            "admission_date",
            "discharge_date",
            "clinical_notes",
            "medication_orders",
            "last_condition_update_by_name",
            "last_condition_update_at",
        ]

    def get_clinical_notes(self, obj):
        from apps.patients.serializers.nurse_serializers import ClinicalNoteSerializer
        return ClinicalNoteSerializer(obj.clinical_notes.all().order_by("-created_at"), many=True).data

    def get_medication_orders(self, obj):
        return MedicationOrderSerializer(obj.medication_orders.all().order_by("-is_active", "-created_at"), many=True).data