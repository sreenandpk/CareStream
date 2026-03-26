import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from apps.core.role_permissions import (
    IsAdminOrSystemAdmin,
)
from apps.wards.serializers.admin_serializers import (
    AdminWardSerializer,
)
from apps.wards.services.ward_service import (
    get_all_wards,
    get_ward_by_id,
    create_ward,
    update_ward,
    delete_ward,
)
app_logger = logging.getLogger("app")
audit_logger = logging.getLogger("audit")
security_logger = logging.getLogger("security")
error_logger = logging.getLogger("django.request")
class AdminWardListCreateView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdminOrSystemAdmin,
    ]
    @extend_schema(
        tags=["Wards Admin"],
        responses=AdminWardSerializer(many=True),
    )
    def get(self, request):
        app_logger.info(
            f"Ward list requested by {request.user.username}"
        )
        wards = get_all_wards()
        serializer = AdminWardSerializer(
            wards,
            many=True,
        )
        return Response(
            {
                "success": True,
                "data": serializer.data,
            }
        )
    @extend_schema(
        tags=["Wards Admin"],
        request=AdminWardSerializer,
        responses=AdminWardSerializer,
    )
    def post(self, request):
        app_logger.info(
            f"Create ward request by {request.user.username}"
        )
        serializer = AdminWardSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        ward = create_ward(
            serializer.validated_data,
            request.user,
        )
        audit_logger.info(
            f"Ward created {ward.name} by {request.user.username}"
        )
        return Response(
            {
                "success": True,
                "data": AdminWardSerializer(ward).data,
            },
            status=status.HTTP_201_CREATED,
        )
class AdminWardDetailView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdminOrSystemAdmin,
    ]
    @extend_schema(
        tags=["Wards Admin"],
        responses=AdminWardSerializer,
    )
    def get(self, request, ward_id):
        app_logger.info(
            f"Ward detail requested {ward_id} by {request.user.username}"
        )
        ward = get_ward_by_id(ward_id)
        return Response(
            {
                "success": True,
                "data": AdminWardSerializer(ward).data,
            }
        )
    @extend_schema(
        tags=["Wards Admin"],
        request=AdminWardSerializer,
        responses=AdminWardSerializer,
    )
    def put(self, request, ward_id):
        app_logger.info(
            f"Ward update request {ward_id} by {request.user.username}"
        )
        serializer = AdminWardSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        ward = update_ward(
            ward_id,
            serializer.validated_data,
            request.user,
        )
        audit_logger.info(
            f"Ward updated {ward.id} by {request.user.username}"
        )
        return Response(
            {
                "success": True,
                "data": AdminWardSerializer(ward).data,
            }
        )
    @extend_schema(
        tags=["Wards Admin"],
        responses=None,
    )
    def delete(self, request, ward_id):
        app_logger.info(
            f"Ward delete request {ward_id} by {request.user.username}"
        )
        delete_ward(
            ward_id,
            request.user,
        )
        audit_logger.info(
            f"Ward deleted {ward_id} by {request.user.username}"
        )
        return Response(
            {
                "success": True,
                "message": "Ward deleted",
            },
            status=status.HTTP_204_NO_CONTENT,
        )