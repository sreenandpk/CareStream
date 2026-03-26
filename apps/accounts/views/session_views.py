from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.role_permissions import IsAdminOrSystemAdmin
from django.contrib.auth import get_user_model
from apps.accounts.services.session_service import (
    force_logout_user,
    force_logout_all,
)
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
User = get_user_model()
@method_decorator(
    ratelimit(key="ip", rate="10/m", block=True),
    name="post",
)
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="user_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
        ),
    ],
    request=OpenApiTypes.OBJECT,
    responses={
        200: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT,
    },
)
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
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="post",
)
@extend_schema(
    request=OpenApiTypes.OBJECT,
    responses={
        200: OpenApiTypes.OBJECT,
    },
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