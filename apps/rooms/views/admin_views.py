import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.rooms.models import Room
from apps.rooms.serializers.admin_serializers import AdminRoomSerializer
from apps.rooms.services.room_service import (
    get_all_rooms,
    create_room,
    update_room,
    delete_room,
)

app_logger = logging.getLogger("app")
audit_logger = logging.getLogger("audit")
error_logger = logging.getLogger("django.request")


# 🔹 LIST + CREATE
class AdminRoomListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Rooms Admin"],
        responses=AdminRoomSerializer(many=True),
    )
    def get(self, request):
        app_logger.info(
            f"Room list requested by {request.user.username}"
        )

        # ✅ PERFORMANCE OPTIMIZATION
        rooms = (
            get_all_rooms()
            .select_related("ward")        # FK
            .prefetch_related("beds")      # reverse FK
        )

        serializer = AdminRoomSerializer(rooms, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


    @extend_schema(
        tags=["Rooms Admin"],
        request=AdminRoomSerializer,
        responses=AdminRoomSerializer,
    )
    def post(self, request):
        app_logger.info(
            f"Create room request by {request.user.username}"
        )

        serializer = AdminRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        room = create_room(
            serializer.validated_data,
            request.user,
        )

        audit_logger.info(
            f"Room created {room.id} by {request.user.username}"
        )

        return Response(
            {
                "success": True,
                "data": AdminRoomSerializer(room).data,
            },
            status=status.HTTP_201_CREATED,
        )


# 🔹 DETAIL / UPDATE / DELETE
class AdminRoomDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Rooms Admin"],
        responses=AdminRoomSerializer,
    )
    def get(self, request, room_id):
        app_logger.info(
            f"Room detail {room_id} by {request.user.username}"
        )

        # ✅ OPTIMIZED FETCH
        room = get_object_or_404(
            Room.objects.select_related("ward").prefetch_related("beds"),
            id=room_id
        )

        serializer = AdminRoomSerializer(room)

        return Response({
            "success": True,
            "data": serializer.data,
        })


    @extend_schema(
        tags=["Rooms Admin"],
        request=AdminRoomSerializer,
        responses=AdminRoomSerializer,
    )
    def put(self, request, room_id):
        app_logger.info(
            f"Room update {room_id} by {request.user.username}"
        )

        # ✅ LOAD INSTANCE (IMPORTANT FIX)
        room_instance = get_object_or_404(Room, id=room_id)

        serializer = AdminRoomSerializer(
            instance=room_instance,
            data=request.data,
        )
        serializer.is_valid(raise_exception=True)

        room = update_room(
            room_id,
            serializer.validated_data,
            request.user,
        )

        audit_logger.info(
            f"Room updated {room.id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "data": AdminRoomSerializer(room).data,
        })


    @extend_schema(
        tags=["Rooms Admin"],
        responses=None,
    )
    def delete(self, request, room_id):
        app_logger.info(
            f"Room delete {room_id} by {request.user.username}"
        )

        delete_room(room_id, request.user)

        audit_logger.info(
            f"Room deleted {room_id} by {request.user.username}"
        )

        return Response(
            {
                "success": True,
                "message": "Room deleted",
            },
            status=status.HTTP_204_NO_CONTENT,
        )