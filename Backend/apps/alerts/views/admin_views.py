import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.alerts.serializers.admin_serializers import AdminAlertSerializer
from apps.alerts.services.admin_alert_service import (
    get_all_alerts,
    get_alert_by_id,
)

logger = logging.getLogger("alerts_admin")


# 🔷 LIST ALERTS (with pagination)
class AdminAlertListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Alerts Admin"],
        responses=AdminAlertSerializer(many=True),
    )
    def get(self, request):
        try:
            queryset = get_all_alerts()

            # 🔥 SIMPLE PAGINATION
            page = int(request.GET.get("page", 1))
            limit = int(request.GET.get("limit", 20))

            start = (page - 1) * limit
            end = start + limit

            alerts = queryset[start:end]

            return Response({
                "success": True,
                "page": page,
                "limit": limit,
                "data": AdminAlertSerializer(alerts, many=True).data
            })

        except Exception as e:
            logger.error(f"Error fetching alerts: {str(e)}")
            return Response(
                {"success": False, "message": "Failed to fetch alerts"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# 🔷 ALERT DETAIL
class AdminAlertDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Alerts Admin"],
        responses=AdminAlertSerializer,
    )
    def get(self, request, alert_id):
        try:
            alert = get_alert_by_id(alert_id)

            return Response({
                "success": True,
                "data": AdminAlertSerializer(alert).data
            })

        except Exception as e:
            logger.error(f"Error fetching alert {alert_id}: {str(e)}")
            return Response(
                {"success": False, "message": "Alert not found"},
                status=status.HTTP_404_NOT_FOUND
            )


# 🔷 ACKNOWLEDGE
class AdminAlertAcknowledgeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Alerts Admin"],
        request=None,
        responses=None,
        operation_id="admin_alert_acknowledge",
    )
    def post(self, request, alert_id):
        try:
            alert = get_alert_by_id(alert_id)

            if alert.status == "ACKNOWLEDGED":
                return Response({
                    "success": True,
                    "message": "Already acknowledged"
                })

            alert.acknowledge()

            logger.info(f"Alert {alert.id} acknowledged by {request.user.id}")

            return Response({
                "success": True,
                "message": "Acknowledged"
            })

        except Exception as e:
            logger.error(f"Acknowledge failed for {alert_id}: {str(e)}")
            return Response(
                {"success": False, "message": "Failed to acknowledge"},
                status=status.HTTP_400_BAD_REQUEST
            )


# 🔷 RESOLVE
class AdminAlertResolveView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Alerts Admin"],
        request=None,
        responses=None,
        operation_id="admin_alert_resolve",
    )
    def post(self, request, alert_id):
        try:
            alert = get_alert_by_id(alert_id)

            if alert.status == "RESOLVED":
                return Response({
                    "success": True,
                    "message": "Already resolved"
                })

            alert.resolve()

            logger.info(f"Alert {alert.id} resolved by {request.user.id}")

            return Response({
                "success": True,
                "message": "Resolved"
            })

        except Exception as e:
            logger.error(f"Resolve failed for {alert_id}: {str(e)}")
            return Response(
                {"success": False, "message": "Failed to resolve"},
                status=status.HTTP_400_BAD_REQUEST
            )