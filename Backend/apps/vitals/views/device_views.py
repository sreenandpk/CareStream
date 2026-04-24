import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from apps.devices.models import Device
from apps.vitals.serializers.device_serializers import DeviceIngestionSerializer
from apps.vitals.services.vital_service import create_vital

logger = logging.getLogger("app")
audit_logger = logging.getLogger("audit")
security_logger = logging.getLogger("security")

class DeviceIngestionView(APIView):
    """
    🔐 SECURE HARDWARE INGESTION ENDPOINT
    Strictly handles telemetry from trusted clinical devices.
    """
    permission_classes = [AllowAny]

    @method_decorator(ratelimit(key='header:x-device-key', rate='5/s', method='POST', block=True))
    def post(self, request):
        # 1. Identity Verification
        serial_number = request.data.get("serial_number")
        device_key = request.headers.get("X-DEVICE-KEY")
        request_ip = request.META.get('REMOTE_ADDR')

        if not serial_number or not device_key:
            return Response(
                {"success": False, "message": "Clinical Identity Missing"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 2. Auth & Fetch
        try:
            device = Device.objects.get(serial_number=serial_number)
        except Device.DoesNotExist:
            security_logger.warning(f"Spoof Attempt: Unknown serial {serial_number} from {request_ip}")
            return Response(
                {"success": False, "message": "Device Not Registered"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # CHECK 1: Revocation Guard
        if device.is_key_revoked:
            security_logger.error(f"Access DENIED: Keys revoked for device {serial_number}")
            return Response(
                {"success": False, "message": "Credentials Revoked"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # CHECK 2: Main API Key
        is_authenticated = (device.api_key == device_key)

        # CHECK 3: Rotation Grace Period (Fallback)
        if not is_authenticated and device.previous_api_key == device_key:
            if device.is_grace_period_valid():
                is_authenticated = True
                logger.info(f"Grace Period Use: Device {serial_number} authenticated with legacy key")
            else:
                security_logger.warning(f"Expired Key: Legacy key used for {serial_number} after grace period")

        if not is_authenticated:
            security_logger.error(f"Auth Failure: Invalid key chain for {serial_number}")
            return Response(
                {"success": False, "message": "Authentication Failed"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 3. Security Guardrails
        if not device.is_active:
            return Response(
                {"success": False, "message": "Hardware Interface Inactive"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        if device.mode == "SIMULATION":
            # Safety: Rejects external ingestion if the device is currently in a controlled simulation session
            security_logger.warning(f"Mode Mismatch: External data rejected for SIM-locked device {serial_number}")
            return Response(
                {"success": False, "message": "Device locked in SIMULATION mode"}, 
                status=status.HTTP_409_CONFLICT
            )

        # 4. Monitoring (IP Logging)
        if device.ip_address and device.ip_address != request_ip:
            security_logger.warning(f"IP Mismatch: Device {serial_number} reporting from {request_ip} instead of {device.ip_address}")

        # 5. Load & Validate Frame
        serializer = DeviceIngestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 6. Persistence & Internal Propagation
        try:
            payload = serializer.validated_data
            payload["device"] = device  # Inject validated hardware instance
            payload["patient"] = getattr(device.bed, "patient", None) if device.bed else None

            vital = create_vital(payload, user=None)

            audit_logger.info(f"Ingestion SUCCESS: {serial_number} | Vital {vital.id} | IP {request_ip}")
            return Response(
                {"success": True, "vital_id": vital.id, "timestamp": timezone.now().isoformat()},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Critical Ingestion Failure for {serial_number}: {str(e)}")
            return Response(
                {"success": False, "message": "Clinical Data Processing Error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
