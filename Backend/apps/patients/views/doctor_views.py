import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsDoctor
from apps.patients.models import Patient
from apps.patients.serializers.doctor_serializers import DoctorPatientSerializer

app_logger = logging.getLogger("app")


class DoctorPatientListView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Patients Doctor"],
        responses=DoctorPatientSerializer(many=True),
    )
    def get(self, request):
        user = request.user

        app_logger.info(f"Doctor patient list {user.username}")

        patients = (
            Patient.objects.filter(
                doctor=user,
                is_active=True
            )
            .select_related("bed__room__ward", "doctor")
            .order_by("-admission_date")
        )

        serializer = DoctorPatientSerializer(patients, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class DoctorPatientDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Patients Doctor"],
        responses=DoctorPatientSerializer,
    )
    def get(self, request, patient_id):
        user = request.user

        patient = get_object_or_404(
            Patient.objects.filter(doctor=user),
            id=patient_id
        )

        serializer = DoctorPatientSerializer(patient)

        return Response({
            "success": True,
            "data": serializer.data,
        })