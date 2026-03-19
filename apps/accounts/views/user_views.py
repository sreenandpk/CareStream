from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
import logging
from apps.accounts.serializers.session_serializer import (
    SessionSerializer,
)
app_logger = logging.getLogger("app")
audit_logger = logging.getLogger("audit")
security_logger = logging.getLogger("security")
error_logger = logging.getLogger("django.request")

from apps.accounts.services.otp_service import generate_otp
from apps.accounts.serializers.user_serializers import CreateUserSerializer
from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.accounts.services.email_service import send_user_credentials
from apps.accounts.services.user_service import (
    get_all_users,
    get_user_by_id,
)
from apps.accounts.serializers.user_serializers import (
    UserListSerializer,UserUpdateSerializer
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from apps.accounts.serializers.password_serializers import (
    ChangePasswordSerializer,
    AdminForceResetSerializer,
)


# =====================
# CREATE USER
# =====================
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="post",
)
class CreateUserView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def post(self, request):

        app_logger.info("Create user request")

        serializer = CreateUserSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        audit_logger.info(
            f"User created {user.username}"
        )

        if user.email:
            try:
                send_user_credentials(
                    email=user.email,
                    username=user.username,
                    password=serializer.context.get("raw_password"),
                )
            except Exception as e:

                error_logger.error(
                    f"Email error {str(e)}"
                )

        return Response(
            {
                "success": True,
                "message": "User created successfully",
                "data": {
                    "username": user.username,
                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )


# =====================
# USER LIST
# =====================
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="get",
)
class UserListView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def get(self, request):

        app_logger.info("User list requested")

        users = get_all_users()

        serializer = UserListSerializer(
            users,
            many=True
        )

        return Response(
            {
                "success": True,
                "data": serializer.data
            }
        )


# =====================
# USER DETAIL
# =====================
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="get",
)
class UserDetailView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def get(self, request, user_id):

        app_logger.info(f"User detail {user_id}")

        user = get_user_by_id(user_id)

        serializer = UserListSerializer(user)

        return Response(
            {
                "success": True,
                "data": serializer.data
            }
        )


# =====================
# USER UPDATE
# =====================
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="put",
)
class UserUpdateView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def put(self, request, user_id):

        app_logger.info(f"User update {user_id}")

        user = get_user_by_id(user_id)

        serializer = UserUpdateSerializer(
            user,
            data=request.data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        audit_logger.info(
            f"User updated {user.username}"
        )

        return Response(
            {
                "success": True,
                "message": "User updated",
                "data": serializer.data
            }
        )


# =====================
# USER DEACTIVATE
# =====================
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="patch",
)
class UserDeactivateView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def patch(self, request, user_id):

        app_logger.info(f"Deactivate user {user_id}")

        user = get_user_by_id(user_id)

        if user.role == "SYSTEM_ADMIN":
            security_logger.warning(
                "Try deactivate system admin"
            )
            return Response(
                {"message": "Cannot deactivate system admin"},
                status=400
            )

        if user == request.user:
            security_logger.warning(
                "Try deactivate self"
            )
            return Response(
                {"message": "Cannot deactivate yourself"},
                status=400
            )

        if not user.is_active:
            return Response(
                {
                    "success": False,
                    "message": "User already inactive",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user.save()

        audit_logger.info(
            f"User deactivated {user.username}"
        )

        return Response(
            {
                "success": True,
                "message": "User deactivated",
            },
            status=status.HTTP_200_OK,
        )


# =====================
# CHANGE PASSWORD
# =====================
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="post",
)
class ChangePasswordView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        app_logger.info("Change password request")

        serializer = ChangePasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = request.user

        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]

        if not user.check_password(old_password):

            security_logger.warning(
                f"Wrong password {user.username}"
            )

            raise ValidationError(
                "Old password is incorrect"
            )

        if user.check_password(new_password):
            raise ValidationError(
                "New password cannot be same as old password"
            )

        user.set_password(new_password)
        user.save()

        audit_logger.info(
            f"Password changed {user.username}"
        )

        return Response(
            {
                "success": True,
                "message": "Password changed successfully",
            },
            status=status.HTTP_200_OK,
        )


# =====================
# ADMIN FORCE RESET
# =====================
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="post",
)
class AdminForceResetView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def post(self, request, user_id):

        app_logger.info(f"Force reset {user_id}")

        serializer = AdminForceResetSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = get_user_by_id(user_id)

        if user.role == "SYSTEM_ADMIN":
            security_logger.warning(
                "Force reset system admin"
            )
            raise ValidationError(
                "Cannot force reset for system admin"
            )

        if user == request.user:
            raise ValidationError(
                "Cannot force reset yourself"
            )

        if hasattr(user, "force_password_reset"):
            user.force_password_reset = True

        user.save()

        generate_otp(user)

        audit_logger.info(
            f"Force reset {user.username}"
        )

        return Response(
            {
                "success": True,
                "message": "User must reset password",
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )


# =====================
# UNLOCK USER
# =====================
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="patch",
)
class UnlockUserView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def patch(self, request, user_id):

        app_logger.info(f"Unlock user {user_id}")

        user = get_user_by_id(user_id)

        if not user.is_locked:
            return Response(
                {
                    "success": False,
                    "message": "User is not locked",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.role == "SYSTEM_ADMIN":
            raise ValidationError(
                "Cannot unlock system admin"
            )

        user.is_locked = False
        user.failed_login_attempts = 0
        user.save()

        audit_logger.info(
            f"User unlocked {user.username}"
        )

        return Response(
            {
                "success": True,
                "message": "User unlocked",
            },
            status=status.HTTP_200_OK,
        )

class OnlineUsersView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def get(self, request):

        sessions = get_active_sessions()

        serializer = SessionSerializer(
            sessions,
            many=True
        )

        return Response(
            {
                "success": True,
                "online_users": serializer.data,
            }
        )