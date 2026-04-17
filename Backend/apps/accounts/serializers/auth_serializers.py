from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True
    )
    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        if not username or not password:
            raise serializers.ValidationError(
                "Username and password required"
            )
        try:
            # Check if it's a username or email
            if "@" in username:
                user = User.objects.get(email=username)
            else:
                user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid credentials"
            )

        if user.is_locked:
            raise serializers.ValidationError(
                "Account locked due to multiple failed attempts. Please contact support."
            )

        if not user.check_password(password):
            if user.role != "ADMIN":
                user.failed_login_attempts += 1
                remaining = 5 - user.failed_login_attempts
                
                if user.failed_login_attempts >= 5:
                    user.is_locked = True
                    user.save()
                    raise serializers.ValidationError(
                        "Account locked due to multiple failed attempts. Please contact support."
                    )
                
                user.save()
                raise serializers.ValidationError(
                    f"Invalid credentials. {remaining} attempts remaining before account lock."
                )
            
            raise serializers.ValidationError(
                "Invalid credentials"
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "User account is inactive. Please contact your administrator."
            )

        if user.role != "ADMIN":
            user.failed_login_attempts = 0
            user.save()
        attrs["user"] = user
        return attrs
class VerifyOTPSerializer(serializers.Serializer):
    username = serializers.CharField()
    code = serializers.CharField(
        max_length=6
    )
    def validate(self, attrs):
        username = attrs.get("username")
        code = attrs.get("code")
        if not username or not code:
            raise serializers.ValidationError(
                "username and code required"
            )
        if not code.isdigit() or len(code) != 6:
            raise serializers.ValidationError(
                "Invalid OTP"
            )
        return attrs