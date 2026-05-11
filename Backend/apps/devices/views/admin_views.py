import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
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

        try:
            # 🔥 EXTRACT HIERARCHICAL FILTERS
            filters = {
                "ward_id": request.query_params.get("ward"),
                "room_id": request.query_params.get("room"),
                "bed_id": request.query_params.get("bed"),
                "status": request.query_params.get("status"),
                "mode": request.query_params.get("mode"),
                "search": request.query_params.get("search"),
            }

            # Handle Boolean Filter properly
            is_active = request.query_params.get("is_active")
            if is_active is not None:
                filters["is_active"] = is_active.lower() == "true"

            # ✅ PERFORMANCE FETCH
            devices = (
                get_all_devices(filters)
                .select_related("bed__room__ward", "bed__patient")
            )

            serializer = AdminDeviceSerializer(devices, many=True)
            data = serializer.data

            return Response({
                "success": True,
                "data": data,
            })
        except Exception as e:
            app_logger.error(f"Device list error: {str(e)}")
            return Response(
                {
                    "success": False, 
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @extend_schema(
        tags=["Devices Admin"],
        request=AdminDeviceSerializer,
        responses=AdminDeviceSerializer,
    )
    def post(self, request):
        app_logger.info(f"Create device request by {request.user.username}")

        serializer = AdminDeviceSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            device = create_device(serializer.validated_data, request.user)
        except ValidationError as e:
            # 🔥 Professional flattening (List or Dict)
            if isinstance(e.detail, dict) and e.detail:
                first_val = next(iter(e.detail.values()))
                msg = first_val[0] if isinstance(first_val, list) else first_val
            elif isinstance(e.detail, list) and e.detail:
                msg = e.detail[0]
            else:
                msg = e.detail

            return Response(
                {
                    "success": False, 
                    "message": str(msg)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            app_logger.error(f"Device create error: {str(e)}")
            return Response(
                {
                    "success": False, 
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

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
        try:
            serializer.is_valid(raise_exception=True)

            device = update_device(
                device_id,
                serializer.validated_data,
                request.user,
            )
        except ValidationError as e:
            # 🔥 Professional flattening (List or Dict)
            if isinstance(e.detail, dict) and e.detail:
                first_val = next(iter(e.detail.values()))
                msg = first_val[0] if isinstance(first_val, list) else first_val
            elif isinstance(e.detail, list) and e.detail:
                msg = e.detail[0]
            else:
                msg = e.detail

            return Response(
                {
                    "success": False, 
                    "message": str(msg)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            app_logger.error(f"Device update error: {str(e)}")
            return Response(
                {
                    "success": False, 
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST,
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


class AdminDeviceRotateKeyView(APIView):
    """
    🔄 API KEY ROTATION
    Replaces active key with a new one and moves the current to previous_api_key.
    """
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Devices Admin Security"],
        responses={200: AdminDeviceSerializer},
    )
    def post(self, request, device_id):
        device = get_object_or_404(Device, id=device_id)
        
        old_key_masked = f"{device.api_key[:4]}...{device.api_key[-4:]}"
        device.rotate_api_key()
        new_key_masked = f"{device.api_key[:4]}...{device.api_key[-4:]}"

        audit_logger.info(
            f"API_KEY_ROTATED: Device {device.serial_number} rotated by {request.user.username}. "
            f"Old: {old_key_masked} -> New: {new_key_masked}"
        )

        return Response({
            "success": True,
            "message": "API key rotated successfully. Legacy key valid for 5 minutes.",
            "data": AdminDeviceSerializer(device).data,
        })


class AdminDeviceRevokeKeyView(APIView):
    """
    🚨 HARD REVOCATION
    Invalidates all keys for a device immediately.
    """
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Devices Admin Security"],
        responses={200: AdminDeviceSerializer},
    )
    def post(self, request, device_id):
        device = get_object_or_404(Device, id=device_id)
        
        device.revoke_all_keys()

        audit_logger.warning(
            f"API_KEY_REVOKED: All keys invalidated for device {device.serial_number} by {request.user.username}"
        )

        return Response({
            "success": True,
            "message": "Credentials revoked immediately. All hardware communication blocked.",
            "data": AdminDeviceSerializer(device).data,
        })