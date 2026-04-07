from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class CreateUserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6,
        required=True,
    )

    email = serializers.EmailField(required=True)

    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    # 🔥 NEW (for doctor)
    specialization = serializers.CharField(required=False, allow_null=True)
    license_number = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "role",
            "phone",
            "specialization",   # 🔥 NEW
            "license_number",   # 🔥 NEW
        ]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate(self, data):
        role = data.get("role")

        # 🔥 If doctor → require fields
        if role == "DOCTOR":
            if not data.get("specialization"):
                raise serializers.ValidationError(
                    "Doctor must have specialization"
                )
            if not data.get("license_number"):
                raise serializers.ValidationError(
                    "Doctor must have license number"
                )

        return data

    def validate_role(self, value):
        if value == "SYSTEM_ADMIN":
            raise serializers.ValidationError("Cannot create SYSTEM_ADMIN")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)

        user.force_password_reset = True
        user.is_verified = True

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
            "specialization",   # 🔥 NEW
            "is_active",
            "is_verified",
            "created_at",
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
        ]

    def validate_role(self, value):
        if value == "SYSTEM_ADMIN":
            raise serializers.ValidationError(
                "Cannot assign SYSTEM_ADMIN"
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exclude(
            id=self.instance.id
        ).exists():
            raise serializers.ValidationError(
                "Email already exists"
            )
        return value

    def validate(self, data):
        role = data.get("role", self.instance.role)

        if role == "DOCTOR":
            if not data.get("specialization") and not self.instance.specialization:
                raise serializers.ValidationError(
                    "Doctor must have specialization"
                )

        return data