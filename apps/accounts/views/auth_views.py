from django.conf import settings
import logging
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
app_logger = logging.getLogger("app")
security_logger = logging.getLogger("security")
audit_logger = logging.getLogger("audit")
error_logger = logging.getLogger("django.request")
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.accounts.services.login_history_service import save_login_history
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
from apps.accounts.services.session_service import (create_session,close_session)
# =====================
# LOGIN
# =====================
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="post",
)
class LoginView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        app_logger.info("Login request received")

        serializer = LoginSerializer(
            data=request.data
        )

        # ✅ handle wrong login attempts
        try:
            serializer.is_valid(
                raise_exception=True
            )

        except ValidationError:

            username = request.data.get("username")

            if username:
                try:
                    user = User.objects.get(
                        username=username
                    )

                    security_logger.warning(
                        f"Wrong login {username}"
                    )

                    save_login_history(
                        request=request,
                        username=username,
                        user=user,
                        success=False,
                        reason="wrong_password",
                    )

                except User.DoesNotExist:

                    save_login_history(
                        request=request,
                        username=username,
                        user=None,
                        success=False,
                        reason="user_not_found",
                    )

            raise

        user = serializer.validated_data["user"]

        audit_logger.info(
            f"User found {user.username}"
        )

        # ✅ check locked
        if user.is_locked:

            security_logger.warning(
                f"Locked account login {user.username}"
            )

            save_login_history(
                request=request,
                username=user.username,
                user=user,
                success=False,
                reason="locked",
            )

            raise ValidationError(
                "Account locked"
            )

        # ✅ check inactive
        if not user.is_active:

            security_logger.warning(
                f"Inactive login {user.username}"
            )

            save_login_history(
                request=request,
                username=user.username,
                user=user,
                success=False,
                reason="inactive",
            )

            raise ValidationError(
                "User inactive"
            )

        # ✅ FORCE PASSWORD RESET
        if hasattr(user, "force_password_reset") and user.force_password_reset:

            generate_otp(user)

            audit_logger.info(
                f"Force reset OTP sent {user.username}"
            )

            save_login_history(
                request=request,
                username=user.username,
                user=user,
                success=True,
                reason="force_reset",
            )

            return Response(
                {
                    "success": True,
                    "message": "Password reset required",
                    "reset_required": True,
                    "username": user.username,
                }
            )

        # ✅ OTP for admin
        if user.role in ["ADMIN", "SYSTEM_ADMIN"]:

            generate_otp(user)

            audit_logger.info(
                f"Admin OTP sent {user.username}"
            )

            save_login_history(
                request=request,
                username=user.username,
                user=user,
                success=True,
                reason="otp_required",
            )

            return Response(
                {
                    "success": True,
                    "message": "OTP sent to email",
                    "otp_required": True,
                    "username": user.username,
                }
            )

        # ✅ reset failed attempts on success
        user.failed_login_attempts = 0
        user.save()

        # ✅ NORMAL LOGIN
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        audit_logger.info(
            f"Login success {user.username}"
        )

        save_login_history(
            request=request,
            username=user.username,
            user=user,
            success=True,
            reason="login_success",
        )

        # ✅ SESSION TRACKING (NEW)
        create_session(
            request=request,
            user=user,
            token=str(refresh.access_token),
        )

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
@method_decorator(
    ratelimit(key="ip", rate="5/m", block=True),
    name="post",
)
class VerifyOTPView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        app_logger.info("OTP verify request received")

        serializer = VerifyOTPSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        username = serializer.validated_data["username"]
        code = serializer.validated_data["code"]

        audit_logger.info(
            f"OTP verify attempt {username}"
        )

        try:
            user = User.objects.get(
                username=username
            )
        except User.DoesNotExist:
            security_logger.warning(
                f"OTP verify user not found {username}"
            )
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
            security_logger.warning(
                f"Invalid OTP {username}"
            )
            raise ValidationError(
                "Invalid OTP"
            )

        if otp.is_expired():
            security_logger.warning(
                f"Expired OTP {username}"
            )
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

        audit_logger.info(
            f"OTP verified {username}"
        )

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
@method_decorator(
    ratelimit(key="ip", rate="10/m", block=True),
    name="post",
)
class RefreshView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        app_logger.info("Refresh token request")

        refresh_token = request.COOKIES.get("refresh")

        if not refresh_token:

            security_logger.warning(
                "Refresh token missing"
            )

            raise ValidationError(
                "Refresh token missing"
            )

        try:

            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            audit_logger.info(
                "Access token refreshed"
            )

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

            security_logger.warning(
                "Invalid refresh token"
            )

            raise ValidationError(
                "Invalid refresh token"
            )
# =====================
# LOGOUT
# =====================
@method_decorator(
    ratelimit(key="ip", rate="10/m", block=True),
    name="post",
)
class LogoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        username = request.user.username

        app_logger.info(
            f"Logout request {username}"
        )

        refresh_token = request.COOKIES.get("refresh")

        # ✅ get access token from header
        auth_header = request.headers.get("Authorization")

        access_token = None

        if auth_header and auth_header.startswith("Bearer"):
            access_token = auth_header.split(" ")[1]

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

                audit_logger.info(
                    f"Logout success {username}"
                )

            except TokenError:

                security_logger.warning(
                    f"Invalid refresh token logout {username}"
                )

        # ✅ close session
        if access_token:
            close_session(access_token)

        response.delete_cookie("refresh", path="/")

        return response
# =====================
# FORGOT PASSWORD
# =====================
@method_decorator(
    ratelimit(key="ip", rate="3/m", block=True),
    name="post",
)
class ForgotPasswordView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        app_logger.info("Forgot password request")

        serializer = ForgotPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        username = serializer.validated_data["username"]

        audit_logger.info(
            f"Forgot password attempt {username}"
        )

        try:
            user = User.objects.get(
                username=username
            )
        except User.DoesNotExist:

            security_logger.warning(
                f"Forgot password user not found {username}"
            )

            raise NotFound("User not found")

        generate_otp(user)

        audit_logger.info(
            f"Reset OTP sent {username}"
        )

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
@method_decorator(
    ratelimit(key="ip", rate="3/m", block=True),
    name="post",
)
class VerifyResetOTPView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        app_logger.info("Verify reset OTP request")

        serializer = VerifyResetOTPSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        username = serializer.validated_data["username"]
        code = serializer.validated_data["code"]

        audit_logger.info(
            f"Reset OTP verify attempt {username}"
        )

        try:
            user = User.objects.get(
                username=username
            )
        except User.DoesNotExist:

            security_logger.warning(
                f"Reset OTP user not found {username}"
            )

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

            security_logger.warning(
                f"Invalid reset OTP {username}"
            )

            raise ValidationError(
                "Invalid OTP"
            )

        if otp.is_expired():

            security_logger.warning(
                f"Expired reset OTP {username}"
            )

            raise ValidationError(
                "OTP expired"
            )

        otp.is_used = True
        otp.save()

        audit_logger.info(
            f"Reset OTP verified {username}"
        )

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
@method_decorator(
    ratelimit(key="ip", rate="3/m", block=True),
    name="post",
)
class ResetPasswordView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        app_logger.info("Reset password request")

        serializer = ResetPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        username = serializer.validated_data["username"]
        new_password = serializer.validated_data["new_password"]

        audit_logger.info(
            f"Password reset attempt {username}"
        )

        try:
            user = User.objects.get(
                username=username
            )
        except User.DoesNotExist:

            security_logger.warning(
                f"Reset password user not found {username}"
            )

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

            security_logger.warning(
                f"Reset password OTP missing {username}"
            )

            raise ValidationError(
                "OTP verification required"
            )

        if otp.is_expired():

            security_logger.warning(
                f"Reset password OTP expired {username}"
            )

            raise ValidationError(
                "OTP expired"
            )

        # set password
        user.set_password(new_password)

        if hasattr(user, "force_password_reset"):
            user.force_password_reset = False

        user.save()

        audit_logger.info(
            f"Password reset success {username}"
        )

        return Response(
            {
                "success": True,
                "message": "Password reset successful",
            }
        )