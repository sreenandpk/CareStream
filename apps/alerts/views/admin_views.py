import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.alerts.serializers.admin_serializers import AdminAlertSerializer
from apps.alerts.services.admin_alert_service import (
    get_all_alerts,
    get_alert_by_id,
)

logger = logging.getLogger("app")


class AdminAlertListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Alerts Admin"],
        
        responses=AdminAlertSerializer(many=True),
    )
    def get(self, request):
        alerts = get_all_alerts()

        return Response({
            "success": True,
            "data": AdminAlertSerializer(alerts, many=True).data
        })


class AdminAlertDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Alerts Admin"],
        responses=AdminAlertSerializer,
    )
    def get(self, request, alert_id):
        alert = get_alert_by_id(alert_id)

        return Response({
            "success": True,
            "data": AdminAlertSerializer(alert).data
        })


class AdminAlertAcknowledgeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(tags=["Alerts Admin"],
        request=None,
        responses=None,
        operation_id="admin_alert_acknowledge" )
    def post(self, request, alert_id):
        alert = get_alert_by_id(alert_id)
        alert.acknowledge()

        return Response({
            "success": True,
            "message": "Acknowledged"
        })


class AdminAlertResolveView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(tags=["Alerts Admin"],
        request=None,
        responses=None,
        operation_id="admin_alert_resolve")
    def post(self, request, alert_id):
        alert = get_alert_by_id(alert_id)
        alert.resolve()

        return Response({
            "success": True,
            "message": "Resolved"
        })