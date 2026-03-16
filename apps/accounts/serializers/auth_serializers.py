from rest_framework import serializers
from django.contrib.auth import authenticate


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

        user = authenticate(
            username=username,
            password=password
        )

        if user is None:
            raise serializers.ValidationError(
                "Invalid credentials"
            )

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