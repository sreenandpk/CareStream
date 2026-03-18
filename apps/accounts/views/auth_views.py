from django.conf import settings

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework.exceptions import (
    ValidationError,
    NotFound,
)

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.accounts.serializers.auth_serializers import (
    LoginSerializer,
    VerifyOTPSerializer,
)

from apps.accounts.services.otp_service import generate_otp
from apps.accounts.models import User, OTP
from apps.accounts.serializers.password_serializers import (
    ForgotPasswordSerializer,
    VerifyResetOTPSerializer,
    ResetPasswordSerializer,
)

# =====================
# LOGIN
# =====================
class LoginView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        serializer = LoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.validated_data["user"]

        # check inactive
        if not user.is_active:
            raise ValidationError("User inactive")


        # =====================
        # FORCE PASSWORD RESET
        # =====================
        if hasattr(user, "force_password_reset") and user.force_password_reset:

            generate_otp(user)

            return Response(
                {
                    "success": True,
                    "message": "Password reset required",
                    "reset_required": True,
                    "username": user.username,
                }
            )


        # =====================
        # OTP for admin
        # =====================
        if user.role in ["ADMIN", "SYSTEM_ADMIN"]:

            generate_otp(user)

            return Response(
                {
                    "success": True,
                    "message": "OTP sent to email",
                    "otp_required": True,
                    "username": user.username,
                }
            )


        # =====================
        # NORMAL LOGIN
        # =====================
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        response = Response(
            {
                "success": True,
                "message": "Login successful",
                "data": {
                    "username": user.username,
                    "role": user.role,
                    "access": access_token,
                },
            }
        )

        response.set_cookie(
            key="refresh",
            value=str(refresh),
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax" if settings.DEBUG else "None",
            path="/",
        )

        return response
# =====================
# VERIFY OTP
# =====================
class VerifyOTPView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        serializer = VerifyOTPSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        username = serializer.validated_data["username"]
        code = serializer.validated_data["code"]

        try:
            user = User.objects.get(
                username=username
            )
        except User.DoesNotExist:
            raise NotFound("User not found")

        otp = (
            OTP.objects
            .filter(
                user=user,
                code=code,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp:
            raise ValidationError(
                "Invalid OTP"
            )

        if otp.is_expired():
            raise ValidationError(
                "OTP expired"
            )

        # mark otp used
        otp.is_used = True
        otp.save()

        # mark user verified
        if not user.is_verified:
            user.is_verified = True
            user.save()

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        response = Response(
            {
                "success": True,
                "message": "OTP verified",
                "data": {
                    "username": user.username,
                    "role": user.role,
                    "access": access_token,
                },
            }
        )

        response.set_cookie(
            key="refresh",
            value=str(refresh),
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax" if settings.DEBUG else "None",
            path="/",
        )

        return response
# =====================
# REFRESH
# =====================

class RefreshView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        refresh_token = request.COOKIES.get("refresh")

        if not refresh_token:
            raise ValidationError(
                "Refresh token missing"
            )

        try:

            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            response = Response(
                {
                    "success": True,
                    "message": "Token refreshed",
                    "data": {
                        "access": access_token,
                    },
                }
            )

            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax" if settings.DEBUG else "None",
                path="/",
            )

            return response

        except TokenError:
            raise ValidationError(
                "Invalid refresh token"
            )


# =====================
# LOGOUT
# =====================

class LogoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        refresh_token = request.COOKIES.get("refresh")

        response = Response(
            {
                "success": True,
                "message": "Logged out successfully",
            }
        )

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass

        response.delete_cookie("refresh", path="/")

        return response
# =====================
# FORGOT PASSWORD
# =====================

class ForgotPasswordView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        serializer = ForgotPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        username = serializer.validated_data["username"]

        try:
            user = User.objects.get(
                username=username
            )
        except User.DoesNotExist:
            raise NotFound("User not found")

        generate_otp(user)

        return Response(
            {
                "success": True,
                "message": "If account exists, OTP sent",
                "username": user.username,
            }
        )
# =====================
# VERIFY RESET OTP
# =====================

class VerifyResetOTPView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        serializer = VerifyResetOTPSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        username = serializer.validated_data["username"]
        code = serializer.validated_data["code"]

        try:
            user = User.objects.get(
                username=username
            )
        except User.DoesNotExist:
            raise NotFound("User not found")

        otp = (
            OTP.objects
            .filter(
                user=user,
                code=code,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp:
            raise ValidationError(
                "Invalid OTP"
            )

        if otp.is_expired():
            raise ValidationError(
                "OTP expired"
            )

        otp.is_used = True
        otp.save()

        return Response(
            {
                "success": True,
                "message": "OTP verified",
                "username": user.username,
            }
        )
# =====================
# RESET PASSWORD
# =====================
class ResetPasswordView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        serializer = ResetPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        username = serializer.validated_data["username"]
        new_password = serializer.validated_data["new_password"]

        try:
            user = User.objects.get(
                username=username
            )
        except User.DoesNotExist:
            raise NotFound("User not found")

        # check last OTP used
        otp = (
            OTP.objects
            .filter(
                user=user,
                is_used=True,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp:
            raise ValidationError(
                "OTP verification required"
            )

        if otp.is_expired():
            raise ValidationError(
                "OTP expired"
            )

        # set password
        user.set_password(new_password)

        if hasattr(user, "force_password_reset"):
            user.force_password_reset = False

        user.save()

        return Response(
            {
                "success": True,
                "message": "Password reset successful",
            }
        )