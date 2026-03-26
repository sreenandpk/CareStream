import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from apps.core.role_permissions import (
    IsDoctor,
)
from apps.wards.services.ward_service import (
    get_all_wards,
    get_ward_by_id,
)
from apps.wards.serializers.doctor_serializers import (
    DoctorWardSerializer,
)
app_logger = logging.getLogger("app")
error_logger = logging.getLogger("django.request")
class DoctorWardListView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsDoctor,
    ]
    @extend_schema(
        tags=["Wards Doctor"],
        responses=DoctorWardSerializer(many=True),
    )
    def get(self, request):
        app_logger.info(
            f"Doctor ward list {request.user.username}"
        )
        wards = get_all_wards()
        serializer = DoctorWardSerializer(
            wards,
            many=True,
        )
        return Response(
            {
                "success": True,
                "data": serializer.data,
            }
        )
class DoctorWardDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsDoctor,
    ]
    @extend_schema(
        tags=["Wards Doctor"],
        responses=DoctorWardSerializer,
    )
    def get(self, request, ward_id):
        app_logger.info(
            f"Doctor ward detail {ward_id} by {request.user.username}"
        )
        ward = get_ward_by_id(ward_id)
        serializer = DoctorWardSerializer(
            ward
        )
        return Response(
            {
                "success": True,
                "data": serializer.data,
            }
        )