import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsDoctor
from apps.alerts.serializers.doctor_serializers import DoctorAlertSerializer
from apps.alerts.services.doctor_alert_service import (
    get_doctor_alerts,
    get_doctor_alert_by_id,
    acknowledge_doctor_alert,
    resolve_doctor_alert,
)

logger = logging.getLogger("app")


class DoctorAlertListView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Alerts Doctor"],
        responses=DoctorAlertSerializer(many=True),
    )
    def get(self, request):
        alerts = get_doctor_alerts(request.user)

        return Response({
            "success": True,
            "data": DoctorAlertSerializer(alerts, many=True).data
        })


class DoctorAlertDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(
        tags=["Alerts Doctor"],
        responses=DoctorAlertSerializer,
    )
    def get(self, request, alert_id):
        alert = get_doctor_alert_by_id(alert_id, request.user)

        return Response({
            "success": True,
            "data": DoctorAlertSerializer(alert).data
        })


class DoctorAlertAcknowledgeView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(tags=["Alerts Doctor"],
        operation_id="doctor_alert_acknowledge",
        request=None,
        responses=None,)
    def post(self, request, alert_id):
        alert = get_doctor_alert_by_id(alert_id, request.user)
        acknowledge_doctor_alert(alert)

        return Response({
            "success": True,
            "message": "Alert acknowledged"
        })


class DoctorAlertResolveView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    @extend_schema(tags=["Alerts Doctor"],
        operation_id="doctor_alert_resolve",
        request=None,
        responses=None,)
    def post(self, request, alert_id):
        alert = get_doctor_alert_by_id(alert_id, request.user)
        resolve_doctor_alert(alert)

        return Response({
            "success": True,
            "message": "Alert resolved"
        })