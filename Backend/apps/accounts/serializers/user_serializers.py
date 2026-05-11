from django.contrib.auth import get_user_model
import socket
import urllib.request
import json
import os
import logging

app_logger = logging.getLogger("app")
security_logger = logging.getLogger("security")
audit_logger = logging.getLogger("audit")
User = get_user_model()
from rest_framework import serializers





class CreateUserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6,
        required=True,
    )

    email = serializers.EmailField(required=True)

    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    # 🔥 NEW (for doctor) - allow blank for non-doctor users
    specialization = serializers.CharField(
        required=False, 
        allow_null=True, 
        allow_blank=True
    )
    license_number = serializers.CharField(
        required=False, 
        allow_null=True, 
        allow_blank=True
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "role",
            "phone",
            "specialization",
            "license_number",
            "gender",
        ]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        
        # 🛡️ Professional Setup: Block @ and special characters in usernames
        if not value.isalnum():
            raise serializers.ValidationError(
                "Professional usernames must be alphanumeric (Letters and numbers only). "
                "Email addresses are not allowed as usernames."
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        



        # 🚫 Professional Setup: Block disposable domains
        domain = value.split('@')[-1]
        disposable_domains = ["mailinator.com", "10minutemail.com", "temp-mail.org", "guerrillamail.com"]
        if domain.lower() in disposable_domains:
            raise serializers.ValidationError("Disposable or test email providers are not permitted for professional profiles.")

        # 🌐 Domain Existence Check (Quick DNS)
        try:
            socket.setdefaulttimeout(2.0)
            socket.gethostbyname(domain)
        except socket.gaierror:
            raise serializers.ValidationError(
                f"The email domain '{domain}' does not appear to exist. Please verify for typos."
            )
        except socket.timeout:
            app_logger.warning(f"DNS lookup timeout for {domain}. Skipping validation.")
        
        return value

    def validate(self, data):
        role = data.get("role")

        # 🔥 Block creation of Admin accounts via standard registration
        if role == "ADMIN":
            raise serializers.ValidationError(
                {"role": "Administrative accounts cannot be created through this interface."}
            )

        # Convert empty strings to None for consistency and uniqueness safety
        if data.get("specialization") == "":
            data["specialization"] = None
        if data.get("license_number") == "":
            data["license_number"] = None
        if data.get("phone") == "":
            data["phone"] = None

        # 🔥 If doctor → require fields
        if role == "DOCTOR":
            if not data.get("specialization"):
                raise serializers.ValidationError(
                    {"specialization": "Doctor must have specialization"}
                )
            if not data.get("license_number"):
                raise serializers.ValidationError(
                    {"license_number": "Doctor must have license number"}
                )

        return data

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)

        user.force_password_reset = True
        
        # 🛡️ Professional Setup: Admin-created accounts are auto-verified
        user.is_verified = True
        user.email_status = "valid" 

        user.save()

        self.context["raw_password"] = password
        return user
class UserListSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "phone",
            "specialization",
            "license_number",
            "email_status",
            "is_active",
            "is_locked",
            "failed_login_attempts",
            "is_verified",
            "date_joined",
            "last_login",
            "created_at",
            "updated_at",
            "gender",
        ]
class UserUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "email",
            "phone",
            "role",
            "specialization",   # 🔥 NEW
            "license_number",   # 🔥 NEW
            "is_active",
            "is_locked",
            "gender",
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exclude(
            id=self.instance.id
        ).exists():
            raise serializers.ValidationError(
                "Email already exists"
            )




        # 🛡️ Enterprise Domain Verification (with 2s Timeout)
        domain = value.split('@')[-1]
        
        # 🚫 Professional Setup: Block disposable/test emails
        disposable_domains = ["mailinator.com", "10minutemail.com", "temp-mail.org", "guerrillamail.com"]
        if domain.lower() in disposable_domains:
            raise serializers.ValidationError("Disposable or test email providers are not permitted for professional profiles.")

        try:
            socket.setdefaulttimeout(2.0)
            socket.gethostbyname(domain)
        except socket.gaierror:
            raise serializers.ValidationError(
                f"The email domain '{domain}' does not appear to exist. Please verify for typos."
            )
        except socket.timeout:
            # If DNS is slow, we allow it to avoid hanging the UI
            app_logger.warning(f"DNS lookup timeout for {domain}. Skipping validation.")
        return value

    def validate(self, data):
        role = data.get("role", self.instance.role)

        # Convert empty strings to None
        if "specialization" in data and data["specialization"] == "":
            data["specialization"] = None
        if "license_number" in data and data["license_number"] == "":
            data["license_number"] = None
        if "phone" in data and data["phone"] == "":
            data["phone"] = None

        # 🔥 Role Lockdown: 
        # 1. Prevent promoting ANYONE to Admin via UI
        if "role" in data and data["role"] == "ADMIN" and self.instance.role != "ADMIN":
             raise serializers.ValidationError(
                {"role": "Administrative accounts can only be created via the system CLI."}
            )

        # 2. Prevent demoting or changing an existing Admin's role
        if self.instance.role == "ADMIN":
            if "role" in data and data["role"] != "ADMIN":
                raise serializers.ValidationError(
                    {"role": "Administrative roles are fixed and cannot be changed via the interface."}
                )
            if "email" in data and data["email"] != self.instance.email:
                raise serializers.ValidationError(
                    {"email": "Administrative email addresses are locked for security."}
                )
            if data.get("is_active") is False:
                 raise serializers.ValidationError(
                     {"is_active": "Administrative accounts cannot be deactivated via this view."}
                 )

        # 3. Clinical Staff Transitions (e.g. Nurse -> Doctor)
        if role == "DOCTOR":
            is_turning_doctor = "role" in data and data["role"] == "DOCTOR"
            is_turning_active = data.get("is_active") is True and self.instance.is_active is False
            
            # Re-validate credentials if they are becoming a doctor or back to active
            if is_turning_doctor or is_turning_active or "specialization" in data or "license_number" in data:
                spec = data.get("specialization", self.instance.specialization)
                lic = data.get("license_number", self.instance.license_number)
                
                if not spec:
                    raise serializers.ValidationError({"specialization": "Doctor must have specialization"})
                if not lic:
                    raise serializers.ValidationError({"license_number": "Doctor must have license number"})

        return data