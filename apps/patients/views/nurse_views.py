import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsNurse
from apps.patients.models import Patient
from apps.patients.serializers.nurse_serializers import NursePatientSerializer

app_logger = logging.getLogger("app")


class NursePatientListView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Patients Nurse"],
        responses=NursePatientSerializer(many=True),
    )
    def get(self, request):
        user = request.user

        app_logger.info(f"Nurse patient list {user.username}")

        patients = (
            Patient.objects.filter(
                nurse=user,
                is_active=True
            )
            .select_related("bed__room__ward", "doctor")
            .order_by("-admission_date")
        )

        serializer = NursePatientSerializer(patients, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class NursePatientDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Patients Nurse"],
        responses=NursePatientSerializer,
    )
    def get(self, request, patient_id):
        user = request.user

        patient = get_object_or_404(
            Patient.objects.filter(nurse=user),
            id=patient_id
        )

        serializer = NursePatientSerializer(patient)

        return Response({
            "success": True,
            "data": serializer.data,
        })