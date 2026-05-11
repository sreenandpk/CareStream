from rest_framework import serializers
from apps.wards.models import Ward
from apps.rooms.models import Room
from apps.beds.models import Bed
from apps.patients.serializers.nurse_serializers import NursePatientSerializer

class NurseBedSerializer(serializers.ModelSerializer):
    patient = NursePatientSerializer(read_only=True)
    device_serial = serializers.CharField(source="device.serial_number", read_only=True)
    device_mode = serializers.CharField(source="device.mode", read_only=True)

    class Meta:
        model = Bed
        fields = ["id", "bed_number", "status", "patient", "device_serial", "device_mode"]

class NurseRoomSerializer(serializers.ModelSerializer):
    beds = NurseBedSerializer(many=True, read_only=True)
    class Meta:
        model = Room
        fields = ["id", "room_number", "room_type", "beds"]

class NurseWardSerializer(serializers.ModelSerializer):
    rooms = NurseRoomSerializer(many=True, read_only=True)
    patient_count = serializers.SerializerMethodField()

    class Meta:
        model = Ward
        fields = [
            "id",
            "name",
            "floor",
            "description",
            "rooms",
            "patient_count",
        ]

    def get_patient_count(self, obj):
        from apps.patients.models import Patient
        return Patient.objects.filter(bed__room__ward=obj, is_active=True).count()