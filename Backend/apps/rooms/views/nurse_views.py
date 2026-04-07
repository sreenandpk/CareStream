import logging
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
        user = request.user

        app_logger.info(f"Nurse room list {user.username}")

        rooms = (
            Room.objects.filter(
                beds__patient__nurse=user
            )
            .select_related("ward")
            .prefetch_related("beds__patient")
            .distinct()
        )

        serializer = NurseRoomSerializer(rooms, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class NurseRoomDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Rooms Nurse"],
        responses=NurseRoomSerializer,
    )
    def get(self, request, room_id):
        user = request.user

        room = get_object_or_404(
            Room.objects.filter(
                beds__patient__nurse=user
            )
            .select_related("ward")
            .prefetch_related("beds__patient"),
            id=room_id
        )

        serializer = NurseRoomSerializer(room)

        return Response({
            "success": True,
            "data": serializer.data,
        })