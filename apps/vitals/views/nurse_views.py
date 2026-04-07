import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsNurse
from apps.vitals.models import Vital
from apps.vitals.serializers.nurse_serializers import NurseVitalSerializer

app_logger = logging.getLogger("app")


class NurseVitalListView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Vitals Nurse"],
        responses=NurseVitalSerializer(many=True),
    )
    def get(self, request):
        user = request.user

        app_logger.info(f"Nurse vitals list {user.username}")

        vitals = (
            Vital.objects.filter(
                patient__nurse=user
            )
            .select_related("patient", "device")
            .order_by("-recorded_at")[:100]   # 🔥 LIMIT
        )

        serializer = NurseVitalSerializer(vitals, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class NurseVitalDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Vitals Nurse"],
        responses=NurseVitalSerializer,
    )
    def get(self, request, vital_id):
        user = request.user

        vital = get_object_or_404(
            Vital.objects.filter(
                patient__nurse=user
            ).select_related("patient", "device"),
            id=vital_id
        )

        serializer = NurseVitalSerializer(vital)

        return Response({
            "success": True,
            "data": serializer.data,
        })