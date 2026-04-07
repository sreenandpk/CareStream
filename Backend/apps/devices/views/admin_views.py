import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.devices.models import Device
from apps.devices.serializers.admin_serializers import AdminDeviceSerializer
from apps.devices.services.device_service import (
    get_all_devices,
    create_device,
    update_device,
    delete_device,
)

app_logger = logging.getLogger("app")
audit_logger = logging.getLogger("audit")


class AdminDeviceListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Devices Admin"],
        responses=AdminDeviceSerializer(many=True),
    )
    def get(self, request):
        app_logger.info(f"Device list requested by {request.user.username}")

        # ✅ PERFORMANCE
        devices = (
            get_all_devices()
            .select_related("bed__room__ward", "bed__patient")
        )

        serializer = AdminDeviceSerializer(devices, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


    @extend_schema(
        tags=["Devices Admin"],
        request=AdminDeviceSerializer,
        responses=AdminDeviceSerializer,
    )
    def post(self, request):
        app_logger.info(f"Create device request by {request.user.username}")

        serializer = AdminDeviceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        device = create_device(serializer.validated_data, request.user)

        audit_logger.info(
            f"Device created {device.id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "data": AdminDeviceSerializer(device).data,
        }, status=status.HTTP_201_CREATED)


class AdminDeviceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Devices Admin"],
        responses=AdminDeviceSerializer,
    )
    def get(self, request, device_id):
        app_logger.info(
            f"Device detail {device_id} by {request.user.username}"
        )

        device = get_object_or_404(
            Device.objects.select_related("bed__room__ward", "bed__patient"),
            id=device_id
        )

        return Response({
            "success": True,
            "data": AdminDeviceSerializer(device).data,
        })


    @extend_schema(
        tags=["Devices Admin"],
        request=AdminDeviceSerializer,
        responses=AdminDeviceSerializer,
    )
    def put(self, request, device_id):
        app_logger.info(
            f"Device update {device_id} by {request.user.username}"
        )

        device_instance = get_object_or_404(Device, id=device_id)

        serializer = AdminDeviceSerializer(
            instance=device_instance,
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        device = update_device(
            device_id,
            serializer.validated_data,
            request.user,
        )

        audit_logger.info(
            f"Device updated {device.id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "data": AdminDeviceSerializer(device).data,
        })


    @extend_schema(
        tags=["Devices Admin"],
        responses=None,
    )
    def delete(self, request, device_id):
        app_logger.info(
            f"Device delete {device_id} by {request.user.username}"
        )

        delete_device(device_id, request.user)

        audit_logger.info(
            f"Device deleted {device_id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "message": "Device deleted",
        }, status=status.HTTP_204_NO_CONTENT)