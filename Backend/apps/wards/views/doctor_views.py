import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsDoctor
from apps.wards.models import Ward
from apps.wards.serializers.doctor_serializers import DoctorWardSerializer

app_logger = logging.getLogger("app")


class DoctorWardListView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Wards Doctor"],
        responses=DoctorWardSerializer(many=True),
    )
    def get(self, request):
        user = request.user

        app_logger.info(f"Doctor ward list {user.username}")

        if user.username.startswith("demo_"):
            wards = (
                Ward.objects.all()
                .prefetch_related("rooms__beds__patient")
                .distinct()
            )
        else:
            wards = (
                Ward.objects.filter(
                    rooms__beds__patient__doctor=user
                )
                .prefetch_related("rooms__beds__patient")
                .distinct()
            )

        serializer = DoctorWardSerializer(wards, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class DoctorWardDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Wards Doctor"],
        responses=DoctorWardSerializer,
    )
    def get(self, request, ward_id):
        user = request.user

        if user.username.startswith("demo_"):
            ward = get_object_or_404(
                Ward.objects.prefetch_related("rooms__beds__patient"),
                id=ward_id
            )
        else:
            ward = get_object_or_404(
                Ward.objects.filter(
                    rooms__beds__patient__doctor=user
                ).prefetch_related("rooms__beds__patient"),
                id=ward_id
            )

        serializer = DoctorWardSerializer(ward)

        return Response({
            "success": True,
            "data": serializer.data,
        })