import logging
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.utils import timezone

from apps.core.role_permissions import IsDoctor
from apps.patients.models import Patient, MedicationOrder, ClinicalNote
from apps.patients.serializers.doctor_serializers import DoctorPatientSerializer, MedicationOrderSerializer

app_logger = logging.getLogger("app")


class DoctorPatientListView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request):
        user = request.user
        if user.username == "demo_doctor":
            # Public Demo: Return all active patients so the dashboard is beautifully populated
            patients = (
                Patient.objects.filter(is_active=True)
                .select_related("bed__room__ward", "doctor")
                .order_by("-admission_date")
            )
        else:
            patients = (
                Patient.objects.filter(doctor=user, is_active=True)
                .select_related("bed__room__ward", "doctor")
                .order_by("-admission_date")
            )
        serializer = DoctorPatientSerializer(patients, many=True)
        return Response({"success": True, "data": serializer.data})


class DoctorPatientDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request, patient_id):
        if request.user.username == "demo_doctor":
            patient = get_object_or_404(Patient.objects.filter(is_active=True), id=patient_id)
        else:
            patient = get_object_or_404(Patient.objects.filter(doctor=request.user), id=patient_id)
        serializer = DoctorPatientSerializer(patient)
        return Response({"success": True, "data": serializer.data})


class DoctorMedicationView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request, patient_id):
        orders = MedicationOrder.objects.filter(patient_id=patient_id)
        serializer = MedicationOrderSerializer(orders, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, id=patient_id)
        serializer = MedicationOrderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(patient=patient, prescribed_by=request.user)
            return Response({"success": True, "data": serializer.data})
        return Response({"success": False, "error": serializer.errors}, status=400)


class DoctorNoteCreateView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, id=patient_id)
        content = request.data.get("content")
        if not content:
            return Response({"success": False, "error": "Content required"}, status=400)
        
        note = ClinicalNote.objects.create(
            patient=patient,
            nurse=request.user, # Using nurse field but it's a doctor's note
            content=f"[DOCTOR] {content}"
        )
        return Response({"success": True, "id": note.id})


class ConditionUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, id=patient_id)
        condition = request.data.get("condition")
        if condition not in ["STABLE", "CRITICAL"]:
            return Response({"success": False, "error": "Invalid condition"}, status=400)
        
        patient.clinical_condition = condition
        patient.last_condition_update_by = request.user
        patient.last_condition_update_at = timezone.now()
        patient.save()
        
        return Response({"success": True, "condition": condition})