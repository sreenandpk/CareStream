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
                "bed", "bed__patient", "bed__room", "bed__room__ward"
            )

            # 🔥 CLINICAL SCOPING (Strict Data Isolation)
            if request.user.role == "NURSE":
                from apps.wards.models import Ward
                active_ward_ids = Ward.objects.filter(
                    nurses=request.user,
                    is_active=True
                ).values_list("id", flat=True)
                queryset = queryset.filter(bed__room__ward_id__in=active_ward_ids)
            elif request.user.role == "DOCTOR":
                queryset = queryset.filter(bed__patient__doctor=request.user)

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
            ).select_related("device", "device__bed", "device__bed__room", "device__bed__room__ward")

            # 🔥 CLINICAL SCOPING (Strict Data Isolation)
            if request.user.role == "NURSE":
                from apps.wards.models import Ward
                active_ward_ids = Ward.objects.filter(
                    nurses=request.user,
                    is_active=True
                ).values_list("id", flat=True)
                queryset = queryset.filter(device__bed__room__ward_id__in=active_ward_ids)
            elif request.user.role == "DOCTOR":
                queryset = queryset.filter(device__bed__patient__doctor=request.user)

            if device_id:
                # 🛠️ RESOLUTION: Support both Integer ID and Serial Number String
                target_id = device_id
                if not str(device_id).isdigit():
                    from apps.devices.models import Device
                    device = Device.objects.filter(serial_number=device_id).first()
                    if not device:
                        return Response({"success": False, "error": "Clinical Node not found"}, status=404)
                    target_id = device.id
                
                queryset = queryset.filter(device_id=target_id)
                resolved_device_id = target_id
            else:
                resolved_device_id = None

            # Optimization: Order by recorded_at for chronological graph population
            queryset = queryset.order_by("recorded_at")

            # 📜 AUDIT: Log historical review sessions
            is_review = request.query_params.get("review") == "true"
            if is_review and resolved_device_id:
                try:
                    from apps.vitals.models import ClinicalReviewLog
                    ClinicalReviewLog.objects.create(
                        user=request.user,
                        device_id=resolved_device_id,
                        window_start=threshold,
                        window_end=timezone.now()
                    )
                except Exception as log_err:

                    logger.error(f"AUDIT_FAILURE: Failed to log review session: {str(log_err)}")

            serializer = VitalHistoryItemSerializer(queryset, many=True)
            return Response({
                "success": True,
                "is_historical_recon": is_review,
                "results": serializer.data
            })

        except Exception as e:
            logger.error(f"HISTORY_CRASH: {str(e)}", exc_info=True)
            return Response({
                "success": False, 
                "error": str(e)
            }, status=500)
