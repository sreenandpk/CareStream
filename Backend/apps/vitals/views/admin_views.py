import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.vitals.serializers.admin_serializers import AdminVitalSerializer
from apps.vitals.services.vital_service import (
    get_all_vitals,
    get_vital_by_id,
    create_vital,
    update_vital,
    delete_vital,
)

app_logger = logging.getLogger("app")
audit_logger = logging.getLogger("audit")
error_logger = logging.getLogger("django.request")


class AdminVitalListCreateView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdminOrSystemAdmin,
    ]

    @extend_schema(
        tags=["Vitals Admin"],
        responses=AdminVitalSerializer(many=True),
    )
    def get(self, request):

        app_logger.info(
            f"Vitals list requested by {request.user.username}"
        )

        vitals = get_all_vitals()
        serializer = AdminVitalSerializer(vitals, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })

    @extend_schema(
        tags=["Vitals Admin"],
        request=AdminVitalSerializer,
        responses=AdminVitalSerializer,
    )
    def post(self, request):

        app_logger.info(
            f"Create vital by {request.user.username}"
        )

        serializer = AdminVitalSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)

            vital = create_vital(
                serializer.validated_data,
                request.user,
            )

        except ValidationError as e:
            return Response(
                {"success": False, "error": e.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            error_logger.error(f"Vital create error: {str(e)}")
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        audit_logger.info(
            f"Vital created {vital.id} by {request.user.username}"
        )

        return Response(
            {
                "success": True,
                "data": AdminVitalSerializer(vital).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminVitalDetailView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdminOrSystemAdmin,
    ]

    @extend_schema(
        tags=["Vitals Admin"],
        responses=AdminVitalSerializer,
    )
    def get(self, request, vital_id):

        app_logger.info(
            f"Vital detail {vital_id} by {request.user.username}"
        )

        try:
            vital = get_vital_by_id(vital_id)

        except Exception as e:
            error_logger.error(f"Vital fetch error: {str(e)}")
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "success": True,
            "data": AdminVitalSerializer(vital).data,
        })

    @extend_schema(
        tags=["Vitals Admin"],
        request=AdminVitalSerializer,
        responses=AdminVitalSerializer,
    )
    def put(self, request, vital_id):

        app_logger.info(
            f"Vital update {vital_id} by {request.user.username}"
        )

        # 🔥 partial update support
        serializer = AdminVitalSerializer(
            data=request.data,
            partial=True
        )

        try:
            serializer.is_valid(raise_exception=True)

            vital = update_vital(
                vital_id,
                serializer.validated_data,
                request.user,
            )

        except ValidationError as e:
            return Response(
                {"success": False, "error": e.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            error_logger.error(f"Vital update error: {str(e)}")
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        audit_logger.info(
            f"Vital updated {vital_id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "data": AdminVitalSerializer(vital).data,
        })

    @extend_schema(
        tags=["Vitals Admin"],
        responses=None,
    )
    def delete(self, request, vital_id):

        app_logger.info(
            f"Vital delete {vital_id} by {request.user.username}"
        )

        try:
            delete_vital(
                vital_id,
                request.user,
            )

        except Exception as e:
            error_logger.error(f"Vital delete error: {str(e)}")
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        audit_logger.info(
            f"Vital deleted {vital_id} by {request.user.username}"
        )

        return Response(
            {
                "success": True,
                "message": "Vital deleted",
            },
            status=status.HTTP_204_NO_CONTENT,
        )