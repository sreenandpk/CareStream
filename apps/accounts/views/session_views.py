from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.core.role_permissions import IsAdminOrSystemAdmin
from django.contrib.auth import get_user_model

from apps.accounts.services.session_service import (
    force_logout_user,
    force_logout_all,
)

User = get_user_model()


class ForceLogoutUserView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdminOrSystemAdmin,
    ]

    def post(self, request, user_id):

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"message": "User not found"},
                status=404,
            )

        force_logout_user(user)

        return Response(
            {
                "success": True,
                "message": "User logged out from all sessions",
            }
        )


class ForceLogoutAllView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsAdminOrSystemAdmin,
    ]

    def post(self, request):

        force_logout_all()

        return Response(
            {
                "success": True,
                "message": "All sessions closed",
            }
        )