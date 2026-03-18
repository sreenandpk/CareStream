from rest_framework import serializers


class ChangePasswordSerializer(serializers.Serializer):

    old_password = serializers.CharField(
        write_only=True,
        required=True,
    )

    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=6,
    )

# -----------------------
# FORGOT PASSWORD
# -----------------------

class ForgotPasswordSerializer(serializers.Serializer):

    username = serializers.CharField(
        required=True,
    )


# -----------------------
# VERIFY RESET OTP
# -----------------------

class VerifyResetOTPSerializer(serializers.Serializer):

    username = serializers.CharField(
        required=True,
    )

    code = serializers.CharField(
        max_length=6,
        required=True,
    )


# -----------------------
# RESET PASSWORD
# -----------------------

class ResetPasswordSerializer(serializers.Serializer):

    username = serializers.CharField(
        required=True,
    )

    new_password = serializers.CharField(
        required=True,
        min_length=6,
    )


# -----------------------
# ADMIN FORCE RESET
# -----------------------

from rest_framework import serializers


class ChangePasswordSerializer(serializers.Serializer):

    old_password = serializers.CharField(
        write_only=True,
        required=True,
    )

    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=6,
    )

# -----------------------
# FORGOT PASSWORD
# -----------------------

class ForgotPasswordSerializer(serializers.Serializer):

    username = serializers.CharField(
        required=True,
    )


# -----------------------
# VERIFY RESET OTP
# -----------------------

class VerifyResetOTPSerializer(serializers.Serializer):

    username = serializers.CharField(
        required=True,
    )

    code = serializers.CharField(
        max_length=6,
        required=True,
    )


# -----------------------
# RESET PASSWORD
# -----------------------

class ResetPasswordSerializer(serializers.Serializer):

    username = serializers.CharField(
        required=True,
    )

    new_password = serializers.CharField(
        required=True,
        min_length=6,
    )


# -----------------------
# ADMIN FORCE RESET
# -----------------------
from rest_framework import serializers


class ChangePasswordSerializer(serializers.Serializer):

    old_password = serializers.CharField(
        write_only=True,
        required=True,
    )

    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=6,
    )

# -----------------------
# FORGOT PASSWORD
# -----------------------

class ForgotPasswordSerializer(serializers.Serializer):

    username = serializers.CharField(
        required=True,
    )


# -----------------------
# VERIFY RESET OTP
# -----------------------

class VerifyResetOTPSerializer(serializers.Serializer):

    username = serializers.CharField(
        required=True,
    )

    code = serializers.CharField(
        max_length=6,
        required=True,
    )


# -----------------------
# RESET PASSWORD
# -----------------------

class ResetPasswordSerializer(serializers.Serializer):

    username = serializers.CharField(
        required=True,
    )

    new_password = serializers.CharField(
        required=True,
        min_length=6,
    )


# -----------------------
# ADMIN FORCE RESET
# -----------------------

class AdminForceResetSerializer(serializers.Serializer):

    confirm = serializers.BooleanField(
        required=True
    )

    def validate_confirm(self, value):

        if value is not True:
            raise serializers.ValidationError(
                "Confirmation required"
            )

        return value