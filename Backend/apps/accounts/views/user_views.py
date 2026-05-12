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
from apps.accounts.models import User, OTP
error_logger = logging.getLogger("django.request")
from apps.accounts.services.presence_service import PresenceService
from apps.accounts.services.otp_service import generate_otp
from apps.accounts.services.user_service import get_all_users_unified, get_user_by_id
from django.core.cache import cache
import time
from apps.accounts.serializers.user_serializers import (
    UserListSerializer, UserUpdateSerializer, CreateUserSerializer
)
from apps.accounts.tasks import validate_user_email_background
from apps.core.role_permissions import IsAdmin
from apps.core.pagination import StandardResultsSetPagination
from apps.accounts.services.email_service import (
    send_user_credentials, 
    send_identity_verification_signal
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from apps.accounts.serializers.password_serializers import (
    ChangePasswordSerializer,
    AdminForceResetSerializer,
)
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from apps.accounts.services.session_service import get_active_sessions
@method_decorator(
    ratelimit(key="ip", rate="100/m", block=True),
    name="post",
)
@extend_schema(
    request=CreateUserSerializer,
    responses={
        201: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
    },
)
class CreateUserView(APIView):
    permission_classes = [IsAdmin]
    def post(self, request):
        app_logger.info("Create user request with Real-Time Interceptor")

        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = serializer.save()
            email = user.email
            raw_password = serializer.context.get("raw_password")

            # 1. Trigger the IDENTITY SHIELD signal (SendGrid Webhook Source)
            send_identity_verification_signal(email, user.username)
            
            # Send credentials via Gmail (Deliverability) after signal is out
            send_user_credentials(email, user.username, raw_password)

            # 2. 🛡️ THE INTERCEPTOR (Background): Offload 20s polling to Celery
            validate_user_email_background.delay(user.id, email)
            app_logger.info(f"Identity validation offloaded to background for {email}")

        except Exception as e:
            error_logger.error(f"User registration aborted: {str(e)}")
            if 'user' in locals():
                user.delete()
                
            return Response(
                {
                    "success": False, 
                    "error": "Account registry failure. Please try again."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        audit_logger.info(f"User identity verified & created: {user.username}")

        return Response(
            {
                "success": True,
                "message": "User verified and created successfully",
                "data": {
                    "username": user.username,
                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )
@method_decorator(
    ratelimit(key="ip", rate="100/m", block=True),
    name="get",
)
@extend_schema(
    responses=UserListSerializer,
)
class UserListView(APIView):
    permission_classes = [IsAdmin]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        requester = request.user.username if request.user.is_authenticated else "unknown"
        
        # DEBUG: Print exact query params to terminal
        print(f"DEBUG_VIEW: Raw Params -> {request.query_params}")
        
        role = request.query_params.get("role")
        
        # Get params and normalize
        active_val = request.query_params.get("is_active") or request.query_params.get("active")
        locked_val = request.query_params.get("is_locked") or request.query_params.get("locked")
        search = request.query_params.get("search")

        is_active = None
        if active_val is not None:
            is_active = str(active_val).lower() in ["true", "1"]
            if str(active_val).lower() in ["false", "0"]:
                is_active = False

        is_locked = None
        if locked_val is not None:
            is_locked = str(locked_val).lower() in ["true", "1"]
            if str(locked_val).lower() in ["false", "0"]:
                is_locked = False

        requester_role = request.user.role if hasattr(request.user, "role") else "N/A"
        
        # 🔥 Professional Lockdown: 
        # Clinical staff (Doctor/Nurse) can ONLY see Active, Non-Locked users.
        if requester_role != "ADMIN":
            app_logger.info(f"Enforcing professional filter for {requester_role} '{requester}'")
            is_active = True
            is_locked = False

        app_logger.info(f"User list requested by {requester} ({requester_role}) with filters: role={role}, active={is_active}, locked={is_locked}, search={search}")
        users = get_all_users_unified(role=role, is_active=is_active, is_locked=is_locked, search=search)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(users, request, view=self)
        
        if page is not None:
            serializer = UserListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = UserListSerializer(users, many=True)
        return Response({
            "success": True,
            "data": serializer.data
        })
@method_decorator(
    ratelimit(key="ip", rate="100/m", block=True),
    name="get",
)
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="user_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
        )
    ],
    responses=UserListSerializer,
)
class UserDetailView(APIView):
    permission_classes = [IsAdmin]
    def get(self, request, user_id):
        try:
            user = get_user_by_id(user_id)
            app_logger.info(f"User detail requested for {user.username}")

        except Exception as e:
            error_logger.error(f"User fetch error: {str(e)}")
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = UserListSerializer(user)

        return Response({
            "success": True,
            "data": serializer.data
        })
@method_decorator(
    ratelimit(key="ip", rate="100/m", block=True),
    name="put",
)
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="user_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
        )
    ],
    request=UserUpdateSerializer,
    responses=UserUpdateSerializer,
)
class UserUpdateView(APIView):
    permission_classes = [IsAdmin]
    def put(self, request, user_id):
        try:
            user = get_user_by_id(user_id)
            
            # 🔥 SECURITY LOCKDOWN: Admins cannot edit other Admin accounts
            if user.role == "ADMIN" and user.id != request.user.id:
                security_logger.warning(
                    f"Unauthorized Edit Attempt: Admin '{request.user.username}' tried to edit Admin '{user.username}'"
                )
                return Response(
                    {
                        "success": False, 
                        "error": "Administrative accounts are protected. You cannot edit another administrator."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            app_logger.info(f"User update initiated for {user.username}")


            serializer = UserUpdateSerializer(
                user,
                data=request.data,
                partial=True
            )

            serializer.is_valid(raise_exception=True)
            
            # 🛡️ CLINICAL IDENTITY PROTECTION: Admin-Verified OTP Challenge
            new_email = request.data.get("email")
            otp_code = request.data.get("otp")
            # 🔥 BUG FIX: Check request data for role first, fallback to DB
            role_to_check = request.data.get("role") or user.role
            is_clinical_role = role_to_check in ["DOCTOR", "NURSE"]

            
            # --- STAGE 2: FINAL VERIFICATION ---
            if new_email and is_clinical_role and otp_code:
                app_logger.info(f"OTP Verification attempt for {user.username} email change to {new_email}")
                otp = OTP.objects.filter(
                    user=user,
                    code=otp_code,
                    otp_type="EMAIL_CHANGE",
                    is_used=False
                ).order_by("-created_at").first()

                if not otp or otp.is_expired():
                    security_logger.warning(f"Invalid or Expired OTP for {user.username} email change.")
                    return Response(
                        {"success": False, "error": "Invalid or expired verification code."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # ✅ OTP VALID: Finalize the update
                otp.is_used = True
                otp.save()
                
                updated_user = serializer.save()
                updated_user.is_verified = True # Admin verified it live
                updated_user.email_status = "valid"
                updated_user.save()
                
                audit_logger.info(f"IDENTITY COMMITTED: Email for {user.username} updated to {new_email} via Admin Verification.")
                return Response({
                    "success": True,
                    "message": "Identity verified and updated successfully.",
                    "data": serializer.data
                })

            # --- STAGE 1: CHALLENGE & DELIVERABILITY ---
            if new_email and new_email.lower() != user.email.lower() and is_clinical_role:
                app_logger.info(f"Identity change initiated for {user.username}. Starting 20s Interceptor.")
                
                # 1. 🛡️ IDENTITY SHIELD: Trigger the delivery signal (Source: SENDGRID)
                send_identity_verification_signal(new_email, user.username)
                
                # 2. 🕒 BACKGROUND INTERCEPTOR: Offload deliverability check to Celery
                user.email_status = "pending"
                user.save()
                validate_user_email_background.delay(user.id, new_email)
                app_logger.info(f"Identity change validation offloaded to background for {new_email}")
                
                # 4. 🔑 CHALLENGE: Generate OTP to the NEW email
                generate_otp(user, "EMAIL_CHANGE", custom_email=new_email)
                
                return Response({
                    "success": True,
                    "otp_required": True,
                    "message": f"Verification code sent to {new_email}. Please enter it to finalize the change."
                }, status=status.HTTP_200_OK)

            # Standard update for non-clinical or non-email changes
            serializer.save()

        except Exception as e:
            error_logger.error(f"User update error: {str(e)}")
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        audit_logger.info(f"User updated {user.username} by {request.user.username}")

        return Response({
            "success": True,
            "message": "User updated",
            "data": serializer.data
        })
@method_decorator(
    ratelimit(key="ip", rate="100/m", block=True),
    name="patch",
)
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="user_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
        )
    ],
    request=OpenApiTypes.OBJECT,
    responses=OpenApiTypes.OBJECT,
)
class UserDeactivateView(APIView):
    permission_classes = [IsAdmin]
    def patch(self, request, user_id):
        user = get_user_by_id(user_id)
        app_logger.info(f"Deactivating user {user.username}")
        if user == request.user:
            security_logger.warning(
                "Try deactivate self"
            )
            return Response(
                {"message": "Cannot deactivate yourself"},
                status=400
            )

        # 🔥 Prevent Admins from deactivating other Admins
        if user.role == "ADMIN":
            security_logger.warning(
                f"Admin {request.user.username} tried to deactivate another admin {user.username}"
            )
            return Response(
                {"message": "Administrative accounts cannot be deactivated."},
                status=403
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
            f"User deactivated {user.username} by {request.user.username}"
        )
        return Response(
            {
                "success": True,
                "message": "User deactivated",
            },
            status=status.HTTP_200_OK,
        )
@method_decorator(
    ratelimit(key="ip", rate="100/m", block=True),
    name="post",
)
@extend_schema(
    request=ChangePasswordSerializer,
    responses=OpenApiTypes.OBJECT,
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
            f"Password changed for {user.username}"
        )
        return Response(
            {
                "success": True,
                "message": "Password changed successfully",
            },
            status=status.HTTP_200_OK,
        )
@method_decorator(
    ratelimit(key="ip", rate="100/m", block=True),
    name="post",
)
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="user_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
        )
    ],
    request=AdminForceResetSerializer,
    responses=OpenApiTypes.OBJECT,
)
class AdminForceResetView(APIView):
    permission_classes = [IsAdmin]
    def post(self, request, user_id):
        user = get_user_by_id(user_id)
        app_logger.info(f"Force resetting password for {user.username}")
        serializer = AdminForceResetSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
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
            f"Force reset {user.username} by {request.user.username}"
        )
        return Response(
            {
                "success": True,
                "message": "User must reset password",
                "username": user.username,
            },
            status=status.HTTP_200_OK,
        )
@method_decorator(
    ratelimit(key="ip", rate="100/m", block=True),
    name="patch",
)
@extend_schema(
    parameters=[
        OpenApiParameter(
            name="user_id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
        )
    ],
    request=OpenApiTypes.OBJECT,
    responses=OpenApiTypes.OBJECT,
)
class UnlockUserView(APIView):
    permission_classes = [IsAdmin]
    def patch(self, request, user_id):
        user = get_user_by_id(user_id)
        app_logger.info(f"Unlocking user {user.username}")
        if not user.is_locked:
            return Response(
                {
                    "success": False,
                    "message": "User is not locked",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_locked = False
        user.failed_login_attempts = 0
        user.save()
        audit_logger.info(
            f"User unlocked {user.username} by {request.user.username}"
        )
        return Response(
            {
                "success": True,
                "message": "User unlocked",
            },
            status=status.HTTP_200_OK,
        )
@method_decorator(
    ratelimit(key="ip", rate="100/m", block=True),
    name="get",
)
@extend_schema(
    responses=UserListSerializer(many=True),
)
class OnlineUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        app_logger.info("Real-time online users requested")

        # 🧹 Emergency Cleanup Trigger
        if request.GET.get("reset") == "true":
            PresenceService.clear_all()

        try:
            # 1. Get Live IDs from Redis
            online_ids = PresenceService.get_online_user_ids()
            app_logger.info(f"Presence retrieval: Online IDs retrieved from store: {online_ids}")
            
            # 2. Fetch User objects from DB for these IDs
            online_users = User.objects.filter(id__in=online_ids)
            
            # 3. Serialize (using UserListSerializer which is standard for directories)
            serializer = UserListSerializer(online_users, many=True)

        except Exception as e:
            error_logger.error(f"Presence retrieval error: {str(e)}")
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            "success": True,
            "online_users": [
                {"user": u["id"], "username": u["username"]} 
                for u in serializer.data
            ],
            "data": serializer.data # Keeping data key for backward compatibility if needed
        })