from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.accounts.models import LoginHistory
from apps.accounts.serializers.login_history_serializer import (
    LoginHistorySerializer,
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