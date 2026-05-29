from django.conf import settings
from django.contrib.auth.models import update_last_login
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
from apps.accounts.services.reset_token_service import create_reset_token
from rest_framework.exceptions import (
    ValidationError,
    NotFound,
)
from apps.accounts.models.reset_token import ResetToken
import hashlib
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.accounts.serializers.auth_serializers import (
    LoginSerializer,
    VerifyOTPSerializer,
)
from apps.accounts.serializers.reset_serializer import ConfirmResetSerializer
from apps.accounts.services.otp_service import generate_otp
from apps.accounts.models import User, OTP
from apps.accounts.serializers.password_serializers import (
    ForgotPasswordSerializer,
)
from apps.accounts.services.session_service import (create_session,close_session, force_logout_user)
from drf_spectacular.utils import extend_schema
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
@method_decorator(
    ratelimit(key="ip", rate="5/min", block=True),
    name="post",
)
@extend_schema(
    request=LoginSerializer,
    tags=["Auth"],
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
        403: OpenApiTypes.OBJECT,
    },
)
class LoginView(APIView):
    authentication_classes = []
    permission_classes = []
    def post(self, request):
        app_logger.info("Login request received")
        serializer = LoginSerializer(
            data=request.data
        )
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            username = request.data.get("username")
            app_logger.error(f"❌ TRACE: Serializer Validation Failed for user: {username}")
            if username:
                try:
                    user = User.objects.get(username=username)
                    app_logger.error(f"🔍 TRACE: User {username} EXISTS but password check FAILED.")
                    security_logger.warning(f"Wrong login {username}")
                    save_login_history(
                        request=request,
                        username=username,
                        user=user,
                        success=False,
                        reason="wrong_password",
                    )
                except User.DoesNotExist:
                    app_logger.error(f"🔍 TRACE: User {username} DOES NOT EXIST in this database.")
                    save_login_history(
                        request=request,
                        username=username,
                        user=None,
                        success=False,
                        reason="user_not_found",
                    )
            raise
        user = serializer.validated_data["user"]
        # audit_logger.info(
        #     f"User found {user.username}"
        # )
        if user.is_locked and user.role != "ADMIN":
            app_logger.warning(f"Login failed: User {user.username} is LOCKED")
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
                "Account locked. Please contact support."
            )
        if not user.is_active:
            app_logger.warning(f"Login failed: User {user.username} is INACTIVE")
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
                "User account is inactive."
            )
        if hasattr(user, "force_password_reset") and user.force_password_reset:
            token = create_reset_token(user)
            # audit_logger.info(
            #     f"Reset token generated {user.username}"
            # )
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
                    "reset_token": token,  # dev only (later email)
                    "username": user.username,
                }
            )
        if user.role == "ADMIN":
            OTP.objects.filter(
                user=user,
                otp_type="LOGIN",
                is_used=False
            ).delete()
            generate_otp(user, "LOGIN")
            # audit_logger.info(
            #     f"Admin OTP sent {user.username}"
            # )
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
        user.failed_login_attempts = 0
        user.save()
        
        # 🕒 Capture the exact login timestamp for the User Directory
        update_last_login(None, user)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        # audit_logger.info(
        #     f"Login success {user.username}"
        # )
        save_login_history(
            request=request,
            username=user.username,
            user=user,
            success=True,
            reason="login_success",
        )
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
@method_decorator(
    ratelimit(key="ip", rate="5/min", block=True),
    name="post",
)
@extend_schema(
    request=VerifyOTPSerializer,
    tags=["Auth"],
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
    },
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
                otp_type="LOGIN",
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
        otp.is_used = True
        otp.save()
        if not user.is_verified:
            user.is_verified = True
            user.save()
        audit_logger.info(
            f"OTP verified {username}"
        )
        
        # 🕒 Capture the exact login timestamp for the User Directory
        update_last_login(None, user)

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
@method_decorator(
    ratelimit(key="ip", rate="60/m", block=True),
    name="post",
)
@extend_schema(
    request=OpenApiTypes.OBJECT,
    tags=["Auth"],
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
    },
)
class RefreshView(APIView):
    authentication_classes = []
    permission_classes = []
    def post(self, request):
        app_logger.info("Refresh token request")
        refresh_token = request.COOKIES.get("refresh")
        if not refresh_token:
            security_logger.warning("Refresh token missing")
            raise ValidationError("Refresh token missing")
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            # Retrieve user for logging
            user_id = refresh.get("user_id")
            user = User.objects.get(id=user_id)
            
            audit_logger.info(f"Access token refreshed for {user.username}")
            response = Response({
                "success": True,
                "message": "Token refreshed",
                "data": {
                    "access": access_token,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "role": user.role
                    }
                }
            })
            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax" if settings.DEBUG else "None",
                path="/",
            )
            return response
        except Exception as e:
            security_logger.error(f"Token refresh failed: {str(e)}")
            return Response({
                "success": False,
                "message": "Invalid or expired refresh token. Please login again.",
                "errors": str(e)
            }, status=401)
@method_decorator(
    ratelimit(key="ip", rate="60/m", block=True),
    name="post",
)
@extend_schema(
    request=OpenApiTypes.OBJECT,
    tags=["Auth"],
    responses={
        200: OpenApiTypes.OBJECT,
        401: OpenApiTypes.OBJECT,
    },
)
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        username = request.user.username if request.user.is_authenticated else "anonymous"
        
        # Diagnostic Logging: Identify the phantom caller
        referer = request.META.get("HTTP_REFERER", "unknown")
        user_agent = request.META.get("HTTP_USER_AGENT", "unknown")
        ip = request.META.get("REMOTE_ADDR", "unknown")
        
        security_logger.info(
            f"DIAGNOSTIC: Logout Triggered - User: {username}, IP: {ip}, Referer: {referer}, UA: {user_agent}"
        )
        app_logger.info(f"Logout request started for {username}")

        refresh_token = request.COOKIES.get("refresh")
        auth_header = request.headers.get("Authorization")
        
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
                audit_logger.info(f"Token blacklisted during logout for {username}")
            except TokenError:
                security_logger.warning(f"Invalid refresh token during logout attempt for {username}")

        if request.user.is_authenticated:
            if request.user.username.startswith("demo_"):
                # Isolate logout: Only close the individual session token
                auth_header = request.headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]
                    close_session(token)
                audit_logger.info(f"Demo Session isolated logout completed for {username}")
            else:
                # Global Session Purge for real staff
                force_logout_user(request.user)
                audit_logger.info(f"Global Session Purge executed for {username}")

        response.delete_cookie("refresh", path="/")
        return response

@method_decorator(
    ratelimit(key="ip", rate="3/m", block=True),
    name="post",
)
@extend_schema(
    request=ForgotPasswordSerializer,
    tags=["Auth"],
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
    },
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

        otp = generate_otp(user, "RESET")
        audit_logger.info(
         f"Reset OTP generated {username}"
        )
        return Response(
            {
                "success": True,
                "message": "If account exists, reset link sent",
                "username": user.username,
            }
        )

@method_decorator(
    ratelimit(key="ip", rate="3/m", block=True),
    name="post",
)
@extend_schema(
    request=ConfirmResetSerializer,
    tags=["Auth"],
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
    },
)
class ConfirmResetView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        app_logger.info("Confirm reset token request")

        username = request.data.get("username")
        code = request.data.get("token")  # Can be OTP or ResetToken
        new_password = request.data.get("password")
        old_password = request.data.get("old_password")

        if not username or not code or not new_password:
            raise ValidationError("Username, token and password required")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise ValidationError("User not found")

        # 1. Try OTP (Forgot Password flow)
        otp = OTP.objects.filter(
            user=user,
            code=code,
            otp_type="RESET",
            is_used=False
        ).order_by("-created_at").first()

        # 2. Try ResetToken (Forced Reset flow)
        token_obj = None
        if not otp:
            token_hash = hashlib.sha256(code.encode()).hexdigest()
            token_obj = ResetToken.objects.filter(
                user=user,
                token_hash=token_hash,
                used=False
            ).first()

        if not otp and not token_obj:
            security_logger.warning(f"Invalid reset credentials for {username}")
            raise ValidationError("Invalid verification code or token")

        # Expiry Check
        if otp and otp.is_expired():
            raise ValidationError("Code expired")
        if token_obj and token_obj.is_expired():
            raise ValidationError("Token expired")

        # 3. Handle Old Password if provided (Security Requirement)
        if old_password:
            if not user.check_password(old_password):
                 security_logger.warning(f"Wrong current password for {username} during reset")
                 raise ValidationError("Current password is incorrect")

        user.set_password(new_password)
        user.force_password_reset = False
        user.save()

        if otp:
            otp.is_used = True
            otp.save()
        if token_obj:
            token_obj.used = True
            token_obj.save()

        audit_logger.info(f"Password reset success {user.username}")
        return Response({
            "success": True, 
            "message": "Credentials updated successfully"
        })


@method_decorator(
    ratelimit(key="ip", rate="10/min", block=True),
    name="post",
)
class DemoLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        role_param = request.query_params.get("role", "doctor").upper()
        if role_param not in ["DOCTOR", "NURSE"]:
            role_param = "DOCTOR"

        username = f"demo_{role_param.lower()}"
        
        # 1. Retrieve or dynamically seed the guest account
        demo_user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@carestream.local",
                "role": role_param,
                "is_verified": True,
                "is_active": True,
            }
        )
        
        # 2. Issue access and refresh JWT tokens statelessly
        refresh = RefreshToken.for_user(demo_user)
        access_token = str(refresh.access_token)
        
        # 3. Log the stateful session in CareStream's session tracking service
        create_session(
            request=request,
            user=demo_user,
            token=access_token,
        )
        
        response = Response({
            "success": True,
            "message": "Demo login successful",
            "data": {
                "username": demo_user.username,
                "role": demo_user.role,
                "access": access_token,
                "is_demo": True
            }
        })
        
        # 4. Set HttpOnly Refresh Cookie
        response.set_cookie(
            key="refresh",
            value=str(refresh),
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax" if settings.DEBUG else "None",
            path="/",
        )
        return response