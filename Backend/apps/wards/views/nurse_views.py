import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsNurse
from apps.wards.models import Ward
from apps.wards.serializers.nurse_serializers import NurseWardSerializer

app_logger = logging.getLogger("app")


class NurseWardListView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Wards Nurse"],
        responses=NurseWardSerializer(many=True),
    )
    def get(self, request):
        user = request.user

        app_logger.info(f"Nurse ward list {user.username}")

        wards = (
            Ward.objects.filter(
                rooms__beds__patient__nurse=user
            )
            .prefetch_related("rooms__beds__patient")
            .distinct()
        )

        serializer = NurseWardSerializer(wards, many=True)

        return Response({
            "success": True,
            "data": serializer.data,
        })


class NurseWardDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Wards Nurse"],
        responses=NurseWardSerializer,
    )
    def get(self, request, ward_id):
        user = request.user

        ward = get_object_or_404(
            Ward.objects.filter(
                rooms__beds__patient__nurse=user
            ).prefetch_related("rooms__beds__patient"),
            id=ward_id
        )

        serializer = NurseWardSerializer(ward)

        return Response({
            "success": True,
            "data": serializer.data,
        })