import logging
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
        user = request.user

        app_logger.info(f"Nurse bed list {user.username}")

        beds = (
            Bed.objects.filter(
                patient__nurse=user
            )
            .select_related("patient", "room__ward")
            .distinct()
        )

        serializer = NurseBedSerializer(beds, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class NurseBedDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Beds Nurse"],
        responses=NurseBedSerializer,
    )
    def get(self, request, bed_id):
        user = request.user

        bed = get_object_or_404(
            Bed.objects.filter(
                patient__nurse=user
            ).select_related("patient", "room__ward"),
            id=bed_id
        )

        serializer = NurseBedSerializer(bed)

        return Response({
            "success": True,
            "data": serializer.data,
        })