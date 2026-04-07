import logging
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsDoctor
from apps.rooms.models import Room
from apps.rooms.serializers.doctor_serializers import DoctorRoomSerializer

app_logger = logging.getLogger("app")


class DoctorRoomListView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Rooms Doctor"],
        responses=DoctorRoomSerializer(many=True),
    )
    def get(self, request):
        user = request.user

        app_logger.info(f"Doctor room list {user.username}")

        rooms = (
            Room.objects.filter(
                beds__patient__doctor=user
            )
            .select_related("ward")                 # FK optimization
            .prefetch_related("beds__patient")     # reverse relation optimization
            .distinct()
        )

        serializer = DoctorRoomSerializer(rooms, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class DoctorRoomDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Rooms Doctor"],
        responses=DoctorRoomSerializer,
    )
    def get(self, request, room_id):
        user = request.user

        room = get_object_or_404(
            Room.objects.filter(
                beds__patient__doctor=user
            )
            .select_related("ward")
            .prefetch_related("beds__patient"),
            id=room_id
        )

        serializer = DoctorRoomSerializer(room)

        return Response({
            "success": True,
            "data": serializer.data,
        })