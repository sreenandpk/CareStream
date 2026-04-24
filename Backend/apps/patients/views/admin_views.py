import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.patients.serializers.admin_serializers import AdminPatientSerializer
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
        serializer = AdminPatientSerializer(patients, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })

    @extend_schema(
        tags=["Patients Admin"],
        request=AdminPatientSerializer,
        responses=AdminPatientSerializer,
    )
    def post(self, request):

        app_logger.info(
            f"Create patient request by {request.user.username}"
        )

        serializer = AdminPatientSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)

            patient = create_patient(
                serializer.validated_data,
                request.user,
            )

        except ValidationError as e:
            return Response(
                {
                    "success": False, 
                    "message": str(e.detail[0]) if isinstance(e.detail, list) else str(e.detail)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            error_logger.error(f"Patient create error: {str(e)}")
            return Response(
                {
                    "success": False, 
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST,
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

        try:
            patient = get_patient_by_id(patient_id)

        except Exception as e:
            error_logger.error(f"Patient fetch error: {str(e)}")
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "success": True,
            "data": AdminPatientSerializer(patient).data,
        })

    @extend_schema(
        tags=["Patients Admin"],
        request=AdminPatientSerializer,
        responses=AdminPatientSerializer,
    )
    def put(self, request, patient_id):

        app_logger.info(
            f"Patient update {patient_id} by {request.user.username}"
        )

        try:
            patient_instance = get_patient_by_id(patient_id)
        except Exception as e:
            return Response(
                {"success": False, "message": "Patient not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # 🔥 Pass instance for correct validation (exclude self)
        serializer = AdminPatientSerializer(
            patient_instance,
            data=request.data,
            partial=True
        )

        try:
            serializer.is_valid(raise_exception=True)

            patient = update_patient(
                patient_id,
                serializer.validated_data,
                request.user,
            )

        except ValidationError as e:
            return Response(
                {
                    "success": False, 
                    "message": str(e.detail[0]) if isinstance(e.detail, list) else str(e.detail)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            error_logger.error(f"Patient update error: {str(e)}")
            return Response(
                {
                    "success": False, 
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        audit_logger.info(
            f"Patient updated {patient_id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "data": AdminPatientSerializer(patient).data,
        })

    @extend_schema(
        tags=["Patients Admin"],
        responses=None,
    )
    def delete(self, request, patient_id):

        app_logger.info(
            f"Patient delete {patient_id} by {request.user.username}"
        )

        try:
            delete_patient(patient_id, request.user)

        except Exception as e:
            error_logger.error(f"Patient delete error: {str(e)}")
            return Response(
                {
                    "success": False, 
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST,
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