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
            user = User.objects.get(
                username=username
            )
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid credentials"
            )

        # ✅ check locked
        if user.is_locked:
            raise serializers.ValidationError(
                "Account locked. Contact admin."
            )

        # ✅ check password manually
        if not user.check_password(password):

            user.failed_login_attempts += 1

            # lock after 5 attempts
            if user.failed_login_attempts >= 5:
                user.is_locked = True

            user.save()

            raise serializers.ValidationError(
                "Invalid credentials"
            )

        # ✅ success → reset attempts
        user.failed_login_attempts = 0
        user.save()

        if not user.is_active:
            raise serializers.ValidationError(
                "User inactive"
            )

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

        if len(code) != 6:
            raise serializers.ValidationError(
                "Invalid OTP"
            )

        return attrs