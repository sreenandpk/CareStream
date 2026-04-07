import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.beds.models import Bed
from apps.beds.serializers.admin_serializers import AdminBedSerializer
from apps.beds.services.bed_service import (
    get_all_beds,
    create_bed,
    update_bed,
    delete_bed,
)

app_logger = logging.getLogger("app")
audit_logger = logging.getLogger("audit")


class AdminBedListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Beds Admin"],
        responses=AdminBedSerializer(many=True),
    )
    def get(self, request):
        app_logger.info(f"Bed list requested by {request.user.username}")

        # ✅ PERFORMANCE
        beds = (
            get_all_beds()
            .select_related("room__ward", "patient")   # deep FK
        )

        serializer = AdminBedSerializer(beds, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


    @extend_schema(
        tags=["Beds Admin"],
        request=AdminBedSerializer,
        responses=AdminBedSerializer,
    )
    def post(self, request):
        app_logger.info(f"Create bed request by {request.user.username}")

        serializer = AdminBedSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bed = create_bed(serializer.validated_data, request.user)

        audit_logger.info(
            f"Bed created {bed.id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "data": AdminBedSerializer(bed).data,
        }, status=status.HTTP_201_CREATED)


class AdminBedDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Beds Admin"],
        responses=AdminBedSerializer,
    )
    def get(self, request, bed_id):
        app_logger.info(
            f"Bed detail {bed_id} by {request.user.username}"
        )

        bed = get_object_or_404(
            Bed.objects.select_related("room__ward", "patient"),
            id=bed_id
        )

        return Response({
            "success": True,
            "data": AdminBedSerializer(bed).data,
        })


    @extend_schema(
        tags=["Beds Admin"],
        request=AdminBedSerializer,
        responses=AdminBedSerializer,
    )
    def put(self, request, bed_id):
        app_logger.info(
            f"Bed update {bed_id} by {request.user.username}"
        )

        bed_instance = get_object_or_404(Bed, id=bed_id)

        serializer = AdminBedSerializer(
            instance=bed_instance,
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        bed = update_bed(
            bed_id,
            serializer.validated_data,
            request.user,
        )

        audit_logger.info(
            f"Bed updated {bed.id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "data": AdminBedSerializer(bed).data,
        })


    @extend_schema(
        tags=["Beds Admin"],
        responses=None,
    )
    def delete(self, request, bed_id):
        app_logger.info(
            f"Bed delete {bed_id} by {request.user.username}"
        )

        delete_bed(bed_id, request.user)

        audit_logger.info(
            f"Bed deleted {bed_id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "message": "Bed deleted",
        }, status=status.HTTP_204_NO_CONTENT)