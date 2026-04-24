import logging
from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.devices.models import Device
from apps.vitals.models import Vital
from apps.vitals.serializers.shared_serializers import VitalSnapshotSerializer, VitalHistoryItemSerializer

logger = logging.getLogger("vitals")

class VitalsSnapshotView(APIView):
    """
    🏥 MEDICAL SNAPSHOT API
    Returns the latest known state for all active clinical hardware.
    Highly optimized: Uses cached fields in Device model.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            queryset = Device.objects.filter(
                is_active=True,
                is_key_revoked=False
            ).select_related(
                "bed", "bed__patient", "bed__room"
            )

            # 🔍 Hierarchy Filtering
            ward_id = request.query_params.get("ward")
            room_id = request.query_params.get("room")
            bed_id = request.query_params.get("bed")

            if ward_id:
                queryset = queryset.filter(bed__room__ward_id=ward_id)
            if room_id:
                queryset = queryset.filter(bed__room_id=room_id)
            if bed_id:
                queryset = queryset.filter(bed_id=bed_id)

            serializer = VitalSnapshotSerializer(queryset, many=True)
            return Response({
                "success": True,
                "results": serializer.data
            })
        except Exception as e:
            logger.error(f"SNAPSHOT_CRASH: {str(e)}", exc_info=True)
            return Response({
                "success": False, 
                "error": str(e)
            }, status=500)


class VitalsHistoryView(APIView):
    """
    🕒 RECENT HISTORY API
    Provides last N minutes of telemetry for graph continuity.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            minutes = int(request.query_params.get("minutes", 5))
            device_id = request.query_params.get("device_id")
            
            threshold = timezone.now() - timedelta(minutes=minutes)
            
            queryset = Vital.objects.filter(
                recorded_at__gte=threshold
            ).select_related("device")

            if device_id:
                queryset = queryset.filter(device_id=device_id)

            # Optimization: Order by recorded_at for chronological graph population
            queryset = queryset.order_by("recorded_at")

            serializer = VitalHistoryItemSerializer(queryset, many=True)
            return Response({
                "success": True,
                "results": serializer.data
            })
        except Exception as e:
            logger.error(f"HISTORY_CRASH: {str(e)}", exc_info=True)
            return Response({
                "success": False, 
                "error": str(e)
            }, status=500)
