import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsNurse
from apps.alerts.serializers.nurse_serializers import NurseAlertSerializer
from apps.alerts.services.nurse_alert_service import (
    get_nurse_alerts,
    get_nurse_alert_by_id,
)

logger = logging.getLogger("app")


class NurseAlertListView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Alerts Nurse"],
        responses=NurseAlertSerializer(many=True),
    )
    def get(self, request):
        alerts = get_nurse_alerts(request.user)

        return Response({
            "success": True,
            "data": NurseAlertSerializer(alerts, many=True).data
        })


class NurseAlertDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Alerts Nurse"],
        responses=NurseAlertSerializer,
    )
    def get(self, request, alert_id):
        alert = get_nurse_alert_by_id(alert_id, request.user)

        return Response({
            "success": True,
            "data": NurseAlertSerializer(alert).data
        })