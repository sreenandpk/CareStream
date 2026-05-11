import logging
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsNurse
from apps.patients.models import Patient, ClinicalNote, MedicationOrder, MedicationAdministration
from apps.patients.serializers.nurse_serializers import NursePatientSerializer, ClinicalNoteSerializer
from apps.patients.serializers.medication_serializers import MedicationOrderSerializer, MedicationAdministrationSerializer

app_logger = logging.getLogger("app")


class NursePatientListView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Patients Nurse"],
        responses=NursePatientSerializer(many=True),
    )
    def get(self, request):
        user = request.user
        from apps.wards.models import NurseShift
        from django.utils import timezone
        now = timezone.now()
        
        active_wards = NurseShift.objects.filter(
            nurse=user,
            is_active=True,
            start_time__lte=now,
            end_time__gte=now
        ).values_list('ward_id', flat=True)

        patients = (
            Patient.objects.filter(
                bed__room__ward_id__in=active_wards,
                is_active=True
            )
            .select_related("bed__room__ward", "doctor")
            .order_by("-admission_date")
        ).distinct()

        serializer = NursePatientSerializer(patients, many=True)
        return Response({"success": True, "data": serializer.data})


class NursePatientDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    def get(self, request, patient_id):
        patient = get_object_or_404(Patient.objects.all(), id=patient_id)
        serializer = NursePatientSerializer(patient)
        return Response({"success": True, "data": serializer.data})


class NurseClinicalNoteView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    def get(self, request, patient_id):
        notes = ClinicalNote.objects.filter(patient_id=patient_id).order_by("-created_at")
        serializer = ClinicalNoteSerializer(notes, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request, patient_id):
        patient = get_object_or_404(Patient, id=patient_id)
        serializer = ClinicalNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(patient=patient, nurse=request.user)
            return Response({"success": True, "data": serializer.data})
        return Response({"success": False, "error": serializer.errors}, status=400)


class NurseMedicationOrderListView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    def get(self, request, patient_id):
        orders = MedicationOrder.objects.filter(patient_id=patient_id, is_active=True)
        serializer = MedicationOrderSerializer(orders, many=True)
        return Response({"success": True, "data": serializer.data})


class NurseMedicationAdminView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    def post(self, request, order_id):
        order = get_object_or_404(MedicationOrder, id=order_id)
        serializer = MedicationAdministrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(order=order, nurse=request.user)
            return Response({"success": True, "data": serializer.data})
        return Response({"success": False, "error": serializer.errors}, status=400)