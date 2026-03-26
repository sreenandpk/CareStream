import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from apps.core.role_permissions import (
    IsAdminOrSystemAdmin,
)
from apps.patients.serializers.admin_serializers import (
    AdminPatientSerializer,
)
from apps.patients.services.patient_service import (
    get_all_patients,
    get_patient_by_id,
    create_patient,
    update_patient,
    delete_patient,
)
app_logger = logging.getLogger("app")
audit_logger = logging.getLogger("audit")
error_logger = logging.getLogger("django.request")
class AdminPatientListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdminOrSystemAdmin,
    ]
    @extend_schema(
        tags=["Patients Admin"],
        responses=AdminPatientSerializer(many=True),
    )
    def get(self, request):
        app_logger.info(
            f"Patient list requested by {request.user.username}"
        )
        patients = get_all_patients()
        serializer = AdminPatientSerializer(
            patients,
            many=True,
        )
        return Response(
            {
                "success": True,
                "data": serializer.data,
            }
        )
    @extend_schema(
        tags=["Patients Admin"],
        request=AdminPatientSerializer,
        responses=AdminPatientSerializer,
    )
    def post(self, request):
        app_logger.info(
            f"Create patient request by {request.user.username}"
        )
        serializer = AdminPatientSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        patient = create_patient(
            serializer.validated_data,
            request.user,
        )
        audit_logger.info(
            f"Patient created {patient.id} by {request.user.username}"
        )
        return Response(
            {
                "success": True,
                "data": AdminPatientSerializer(patient).data,
            },
            status=status.HTTP_201_CREATED,
        )
class AdminPatientDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdminOrSystemAdmin,
    ]
    @extend_schema(
        tags=["Patients Admin"],
        responses=AdminPatientSerializer,
    )
    def get(self, request, patient_id):
        app_logger.info(
            f"Patient detail {patient_id} by {request.user.username}"
        )
        patient = get_patient_by_id(patient_id)
        return Response(
            {
                "success": True,
                "data": AdminPatientSerializer(patient).data,
            }
        )
    @extend_schema(
        tags=["Patients Admin"],
        request=AdminPatientSerializer,
        responses=AdminPatientSerializer,
    )
    def put(self, request, patient_id):
        app_logger.info(
            f"Patient update {patient_id} by {request.user.username}"
        )
        serializer = AdminPatientSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        patient = update_patient(
            patient_id,
            serializer.validated_data,
            request.user,
        )
        audit_logger.info(
            f"Patient updated {patient_id} by {request.user.username}"
        )
        return Response(
            {
                "success": True,
                "data": AdminPatientSerializer(patient).data,
            }
        )
    @extend_schema(
        tags=["Patients Admin"],
        responses=None,
    )
    def delete(self, request, patient_id):
        app_logger.info(
            f"Patient delete {patient_id} by {request.user.username}"
        )
        delete_patient(
            patient_id,
            request.user,
        )
        audit_logger.info(
            f"Patient deleted {patient_id} by {request.user.username}"
        )
        return Response(
            {
                "success": True,
                "message": "Patient deleted",
            },
            status=status.HTTP_204_NO_CONTENT,
        )