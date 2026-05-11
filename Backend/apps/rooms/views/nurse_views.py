import logging
import traceback
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsNurse
from apps.rooms.models import Room
from apps.rooms.serializers.nurse_serializers import NurseRoomSerializer

app_logger = logging.getLogger("app")


class NurseRoomListView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Rooms Nurse"],
        responses=NurseRoomSerializer(many=True),
    )
    def get(self, request):
        try:
            user = request.user
            ward_id = request.query_params.get("ward")

            app_logger.info(f"Nurse room fetch - User: {user.username}, Ward Filter: {ward_id}")

            from apps.wards.models import NurseShift
            from django.utils import timezone
            now = timezone.now()
            
            active_wards = NurseShift.objects.filter(
                nurse=user,
                is_active=True,
                start_time__lte=now,
                end_time__gte=now
            ).values_list('ward_id', flat=True)

            rooms = Room.objects.filter(ward_id__in=active_wards)
            
            if ward_id and ward_id != "all":
                rooms = rooms.filter(ward_id=ward_id)

            serializer = NurseRoomSerializer(
                rooms.select_related("ward").distinct(), 
                many=True
            )

            return Response({
                "success": True,
                "data": serializer.data,
            })
        except Exception as e:
            app_logger.error(f"NurseRoomListView Error: {str(e)}")
            app_logger.error(traceback.format_exc())
            return Response({
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=500)


class NurseRoomDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Rooms Nurse"],
        responses=NurseRoomSerializer,
    )
    def get(self, request, room_id):
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

            room = get_object_or_404(
                Room.objects.filter(ward_id__in=active_wards).select_related("ward"),
                id=room_id
            )

            serializer = NurseRoomSerializer(room)

            return Response({
                "success": True,
                "data": serializer.data,
            })
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)