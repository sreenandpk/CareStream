import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsDoctor
from apps.beds.models import Bed
from apps.beds.serializers.doctor_serializers import DoctorBedSerializer

app_logger = logging.getLogger("app")


class DoctorBedListView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Beds Doctor"],
        responses=DoctorBedSerializer(many=True),
    )
    def get(self, request):
        user = request.user

        app_logger.info(f"Doctor bed list {user.username}")

        beds = (
            Bed.objects.filter(
                patient__doctor=user
            )
            .select_related("patient", "room__ward")
            .distinct()
        )

        serializer = DoctorBedSerializer(beds, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class DoctorBedDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Beds Doctor"],
        responses=DoctorBedSerializer,
    )
    def get(self, request, bed_id):
        user = request.user

        bed = get_object_or_404(
            Bed.objects.filter(
                patient__doctor=user
            ).select_related("patient", "room__ward"),
            id=bed_id
        )

        serializer = DoctorBedSerializer(bed)

        return Response({
            "success": True,
            "data": serializer.data,
        })