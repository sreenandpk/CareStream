import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsNurse
from apps.devices.models import Device
from apps.devices.serializers.nurse_serializers import NurseDeviceSerializer

app_logger = logging.getLogger("app")


class NurseDeviceListView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Devices Nurse"],
        responses=NurseDeviceSerializer(many=True),
    )
    def get(self, request):
        user = request.user

        app_logger.info(f"Nurse device list {user.username}")

        devices = (
            Device.objects.filter(
                bed__patient__nurse=user
            )
            .select_related("bed__patient", "bed__room__ward")
            .distinct()
        )

        serializer = NurseDeviceSerializer(devices, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class NurseDeviceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Devices Nurse"],
        responses=NurseDeviceSerializer,
    )
    def get(self, request, device_id):
        user = request.user

        device = get_object_or_404(
            Device.objects.filter(
                bed__patient__nurse=user
            ).select_related("bed__patient", "bed__room__ward"),
            id=device_id
        )

        serializer = NurseDeviceSerializer(device)

        return Response({
            "success": True,
            "data": serializer.data,
        })