import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsDoctor
from apps.devices.models import Device
from apps.devices.serializers.doctor_serializers import DoctorDeviceSerializer

app_logger = logging.getLogger("app")


class DoctorDeviceListView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Devices Doctor"],
        responses=DoctorDeviceSerializer(many=True),
    )
    def get(self, request):
        user = request.user

        app_logger.info(f"Doctor device list {user.username}")

        devices = (
            Device.objects.filter(
                bed__patient__doctor=user
            )
            .select_related("bed__patient", "bed__room__ward")
            .distinct()
        )

        serializer = DoctorDeviceSerializer(devices, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class DoctorDeviceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Devices Doctor"],
        responses=DoctorDeviceSerializer,
    )
    def get(self, request, device_id):
        user = request.user

        device = get_object_or_404(
            Device.objects.filter(
                bed__patient__doctor=user
            ).select_related("bed__patient", "bed__room__ward"),
            id=device_id
        )

        serializer = DoctorDeviceSerializer(device)

        return Response({
            "success": True,
            "data": serializer.data,
        })