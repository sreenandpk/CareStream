import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsDoctor
from apps.vitals.models import Vital
from apps.vitals.serializers.doctor_serializers import DoctorVitalSerializer

app_logger = logging.getLogger("app")


class DoctorVitalListView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Vitals Doctor"],
        responses=DoctorVitalSerializer(many=True),
    )
    def get(self, request):
        user = request.user

        app_logger.info(f"Doctor vitals list {user.username}")

        vitals = (
            Vital.objects.filter(
                patient__doctor=user
            )
            .select_related("patient", "device")
            .order_by("-recorded_at")[:100]   # 🔥 LIMIT (IMPORTANT)
        )

        serializer = DoctorVitalSerializer(vitals, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class DoctorVitalDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Vitals Doctor"],
        responses=DoctorVitalSerializer,
    )
    def get(self, request, vital_id):
        user = request.user

        vital = get_object_or_404(
            Vital.objects.filter(
                patient__doctor=user
            ).select_related("patient", "device"),
            id=vital_id
        )

        serializer = DoctorVitalSerializer(vital)

        return Response({
            "success": True,
            "data": serializer.data,
        })