from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.accounts.services.otp_service import generate_otp
from apps.accounts.serializers.user_serializers import CreateUserSerializer
from apps.core.permissions import IsAdminOrSystemAdmin
from apps.accounts.services.email_service import send_user_credentials
from apps.accounts.services.user_service import (
    get_all_users,
    get_user_by_id,
)
from apps.accounts.serializers.user_list_serializers import (
    UserListSerializer,
)
from apps.accounts.serializers.user_update_serializer import (
    UserUpdateSerializer,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from apps.accounts.serializers.password_serializers import (
    ChangePasswordSerializer,
    AdminForceResetSerializer,
)
class CreateUserView(APIView):
    permission_classes = [IsAdminOrSystemAdmin]
    def post(self, request):
        serializer = CreateUserSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        user = serializer.save()
        # send email safely
        if user.email:
            try:
                send_user_credentials(
                    email=user.email,
                    username=user.username,
                    password = serializer.context.get("raw_password"),
                )
            except Exception as e:
                print("Email error:", e)
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

class UserListView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def get(self, request):

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

class UserDetailView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def get(self, request, user_id):

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

class UserUpdateView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def put(self, request, user_id):

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
class UserDeactivateView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def patch(self, request, user_id):

        user = get_user_by_id(user_id)
        if user.role == "SYSTEM_ADMIN":
            return Response(
                {"message": "Cannot deactivate system admin"},
                status=400
            )

        if user == request.user:
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


class ChangePasswordView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = ChangePasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = request.user

        old_password = serializer.validated_data[
            "old_password"
        ]

        new_password = serializer.validated_data[
            "new_password"
        ]

        # check old password
        if not user.check_password(
            old_password
        ):
            raise ValidationError(
                "Old password is incorrect"
            )

        # prevent same password (use check_password because password is hashed)
        if user.check_password(
            new_password
        ):
            raise ValidationError(
                "New password cannot be same as old password"
            )

        # set new password
        user.set_password(
            new_password
        )

        user.save()

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

class AdminForceResetView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def post(self, request, user_id):

        serializer = AdminForceResetSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = get_user_by_id(user_id)

        # prevent reset for system admin
        if user.role == "SYSTEM_ADMIN":
            raise ValidationError(
                "Cannot force reset for system admin"
            )

        # prevent reset for yourself
        if user == request.user:
            raise ValidationError(
                "Cannot force reset yourself"
            )

        # set force reset flag
        if hasattr(user, "force_password_reset"):
            user.force_password_reset = True

        user.save()

        # generate OTP for reset
        generate_otp(user)

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

class UnlockUserView(APIView):

    permission_classes = [IsAdminOrSystemAdmin]

    def patch(self, request, user_id):

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

        return Response(
            {
                "success": True,
                "message": "User unlocked",
            },
            status=status.HTTP_200_OK,
        )