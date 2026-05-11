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
                nurses=user
            )
            .prefetch_related("rooms__beds__patient")
            .distinct()
        )

        from django.utils import timezone
        now = timezone.now()
        serializer = NurseWardSerializer(wards, many=True)
        # 🛡️ SHIFT LOGIC REMOVED: Always allow nurse access
        return Response({
            "success": True,
            "data": serializer.data,
            "shift_status": {
                "is_active": True,
                "active_wards": [w.id for w in wards],
                "shift_details": {
                    "start_time": now.isoformat(),
                    "end_time": (now + timezone.timedelta(hours=12)).isoformat(),
                    "shift_type": "PERPETUAL"
                }
            }
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
                nurses=user
            ).prefetch_related("rooms__beds__patient"),
            id=ward_id
        )

        serializer = NurseWardSerializer(ward)

        return Response({
            "success": True,
            "data": serializer.data,
        })