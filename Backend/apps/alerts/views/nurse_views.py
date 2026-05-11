import logging
import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import APIException
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsNurse
from apps.alerts.serializers.nurse_serializers import NurseAlertSerializer
from apps.alerts.services.nurse_alert_service import (
    get_nurse_alerts,
    get_nurse_alert_by_id,
    resolve_nurse_alert,
)

logger = logging.getLogger("app")


class NurseAlertListView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Alerts Nurse"],
        responses=NurseAlertSerializer(many=True),
    )
    def get(self, request):
        try:
            alerts = get_nurse_alerts(request.user)
            serializer = NurseAlertSerializer(alerts, many=True)
            return Response({
                "success": True,
                "data": serializer.data
            })
        except Exception as e:
            logger.error(f"NurseAlertListView Error: {str(e)}")
            return Response({
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=500)


class NurseAlertDetailView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Alerts Nurse"],
        responses=NurseAlertSerializer,
    )
    def get(self, request, alert_id):
        try:
            alert = get_nurse_alert_by_id(alert_id, request.user)
            return Response({
                "success": True,
                "data": NurseAlertSerializer(alert).data
            })
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)


class NurseAlertResolveView(APIView):
    permission_classes = [IsAuthenticated, IsNurse]

    @extend_schema(
        tags=["Alerts Nurse"],
        operation_id="nurse_alert_resolve",
        request=None,
        responses=None,
    )
    def post(self, request, alert_id):
        try:
            alert = get_nurse_alert_by_id(alert_id, request.user)
            resolve_nurse_alert(alert, request.user)

            return Response({
                "success": True,
                "message": "Alert resolved and documented"
            })
        except APIException as e:
            # High-fidelity status preservation (403, 404, etc.)
            return Response({
                "success": False,
                "error": str(e.detail) if hasattr(e, 'detail') else str(e)
            }, status=e.status_code)
        except Exception as e:
            logger.error(f"NurseAlertResolveView Error: {str(e)}\n{traceback.format_exc()}")
            return Response({
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=500)