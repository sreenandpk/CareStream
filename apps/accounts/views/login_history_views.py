from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.accounts.models import LoginHistory
from apps.accounts.serializers.login_history_serializer import (
    LoginHistorySerializer,
)
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django_ratelimit.decorators import ratelimit
@method_decorator(
    ratelimit(key="ip", rate="20/m", block=True),
    name="get",
)
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="username",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="success",
            type=OpenApiTypes.BOOL,
            location=OpenApiParameter.QUERY,
        ),
    ],
    responses=LoginHistorySerializer,
)
class LoginHistoryListView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdminOrSystemAdmin,
    ]
    def get(self, request):
        history = LoginHistory.objects.all()
        username = request.query_params.get("username")
        success = request.query_params.get("success")
        if username:
            history = history.filter(username=username)
        if success is not None:
            history = history.filter(success=success)
        serializer = LoginHistorySerializer(
            history,
            many=True,
        )
        return Response(
            {
                "success": True,
                "data": serializer.data,
            }
        )