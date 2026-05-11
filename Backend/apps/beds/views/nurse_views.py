import logging
import traceback
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsNurse
from apps.beds.models import Bed
from apps.beds.serializers.nurse_serializers import NurseBedSerializer

app_logger = logging.getLogger("app")


class NurseBedListView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Beds Nurse"],
        responses=NurseBedSerializer(many=True),
    )
    def get(self, request):
        try:
            user = request.user
            room_id = request.query_params.get("room")
            
            app_logger.info(f"Nurse bed fetch - User: {user.username}, Room Filter: {room_id}")

            from apps.wards.models import NurseShift
            from django.utils import timezone
            now = timezone.now()
            
            active_wards = NurseShift.objects.filter(
                nurse=user,
                is_active=True,
                start_time__lte=now,
                end_time__gte=now
            ).values_list('ward_id', flat=True)

            beds = Bed.objects.filter(room__ward_id__in=active_wards)
            
            if room_id and room_id != "all":
                beds = beds.filter(room_id=room_id)

            serializer = NurseBedSerializer(
                beds.select_related("patient", "room__ward").distinct(), 
                many=True
            )

            return Response({
                "success": True,
                "data": serializer.data,
            })
        except Exception as e:
            app_logger.error(f"NurseBedListView Error: {str(e)}")
            return Response({
                "success": False, 
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=500)


class NurseBedDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Beds Nurse"],
        responses=NurseBedSerializer,
    )
    def get(self, request, bed_id):
        try:
            user = request.user

            from apps.wards.models import NurseShift
            from django.utils import timezone
            now = timezone.now()
            
            active_wards = NurseShift.objects.filter(
                nurse=user,
                is_active=True,
                start_time__lte=now,
                end_time__gte=now
            ).values_list('ward_id', flat=True)

            bed = get_object_or_404(
                Bed.objects.filter(room__ward_id__in=active_wards).select_related("patient", "room__ward"),
                id=bed_id
            )

            serializer = NurseBedSerializer(bed)

            return Response({
                "success": True,
                "data": serializer.data,
            })
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)